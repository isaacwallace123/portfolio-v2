package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

var systemNamespaces = map[string]bool{
	"kube-system":       true,
	"kube-public":       true,
	"kube-node-lease":   true,
}

type kubernetesRepository struct {
	client        *kubernetes.Clientset
	metricsClient *metricsv1beta1.Clientset
	lokiURL       string
}

func NewKubernetesRepository(client *kubernetes.Clientset, metricsClient *metricsv1beta1.Clientset, lokiURL string) portout.ClusterRepository {
	return &kubernetesRepository{client: client, metricsClient: metricsClient, lokiURL: lokiURL}
}

func (r *kubernetesRepository) Ping(ctx context.Context) error {
	_, err := r.client.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
	return err
}

func (r *kubernetesRepository) ListContainers(ctx context.Context) ([]domain.ContainerInfo, error) {
	pods, err := r.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]domain.ContainerInfo, 0, len(pods.Items))
	for _, pod := range pods.Items {
		if systemNamespaces[pod.Namespace] {
			continue
		}

		state, status := podStateAndStatus(pod)
		health := podHealth(pod)

		image := ""
		ports := make([]domain.PortBinding, 0)
		if len(pod.Spec.Containers) > 0 {
			image = pod.Spec.Containers[0].Image
			for _, c := range pod.Spec.Containers {
				for _, p := range c.Ports {
					ports = append(ports, domain.PortBinding{
						PrivatePort: uint16(p.ContainerPort),
						Type:        strings.ToLower(string(p.Protocol)),
					})
				}
			}
		}

		appName := podAppName(pod)
		labels := make(map[string]string, len(pod.Labels))
		for k, v := range pod.Labels {
			labels[k] = v
		}

		result = append(result, domain.ContainerInfo{
			ID:       fmt.Sprintf("%s/%s", pod.Namespace, pod.Name),
			Name:     pod.Name,
			AppName:  appName,
			Labels:   labels,
			Image:    image,
			State:    state,
			Status:   status,
			Health:   health,
			Networks: []string{pod.Namespace},
			Ports:    ports,
			Created:  pod.CreationTimestamp.Time,
		})
	}

	return result, nil
}

func (r *kubernetesRepository) GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error) {
	namespace, podName, err := parseID(id)
	if err != nil {
		return nil, err
	}

	podMetrics, err := r.metricsClient.MetricsV1beta1().PodMetricses(namespace).Get(ctx, podName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	var cpuMillis, memBytes int64
	for _, c := range podMetrics.Containers {
		cpuMillis += c.Usage.Cpu().MilliValue()
		memBytes += c.Usage.Memory().Value()
	}

	pod, err := r.client.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	node, err := r.client.CoreV1().Nodes().Get(ctx, pod.Spec.NodeName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	nodeMemTotal := node.Status.Capacity.Memory().Value()
	nodeCPUMillis := node.Status.Capacity.Cpu().MilliValue()

	cpuPercent := 0.0
	if nodeCPUMillis > 0 {
		cpuPercent = float64(cpuMillis) / float64(nodeCPUMillis) * 100.0
	}
	memPercent := 0.0
	if nodeMemTotal > 0 {
		memPercent = float64(memBytes) / float64(nodeMemTotal) * 100.0
	}

	return &domain.ContainerStats{
		CPUPercent:    cpuPercent,
		MemoryUsage:   uint64(memBytes),
		MemoryLimit:   uint64(nodeMemTotal),
		MemoryPercent: memPercent,
	}, nil
}

func (r *kubernetesRepository) GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error) {
	namespace, podName, err := parseID(id)
	if err != nil {
		return nil, err
	}

	limit := 80
	if n, err := strconv.Atoi(tail); err == nil && n > 0 {
		limit = n
	}

	if r.lokiURL != "" {
		if logs, err := r.getLokiLogs(ctx, namespace, podName, limit); err == nil && len(logs.Lines) > 0 {
			return logs, nil
		}
	}

	tailLines := int64(limit)
	req := r.client.CoreV1().Pods(namespace).GetLogs(podName, &corev1.PodLogOptions{
		TailLines:  &tailLines,
		Timestamps: true,
	})

	stream, err := req.Stream(ctx)
	if err != nil {
		return nil, err
	}
	defer stream.Close()

	raw, err := io.ReadAll(stream)
	if err != nil {
		return nil, err
	}

	lines := make([]string, 0)
	for _, line := range strings.Split(strings.TrimSpace(string(raw)), "\n") {
		if trimmed := strings.TrimSpace(line); trimmed != "" {
			lines = append(lines, trimmed)
		}
	}

	return &domain.ContainerLogs{ContainerID: id, Lines: lines}, nil
}

func (r *kubernetesRepository) getLokiLogs(ctx context.Context, namespace, pod string, limit int) (*domain.ContainerLogs, error) {
	query := fmt.Sprintf(`{namespace=%q, pod=%q}`, namespace, pod)
	end := time.Now()
	start := end.Add(-2 * time.Hour)

	params := url.Values{}
	params.Set("query", query)
	params.Set("start", start.UTC().Format(time.RFC3339Nano))
	params.Set("end", end.UTC().Format(time.RFC3339Nano))
	params.Set("limit", strconv.Itoa(limit))
	params.Set("direction", "backward")

	reqURL := fmt.Sprintf("%s/loki/api/v1/query_range?%s", r.lokiURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Result []struct {
				Values [][]string `json:"values"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	lines := make([]string, 0, limit)
	for _, stream := range result.Data.Result {
		for _, v := range stream.Values {
			if len(v) >= 2 {
				lines = append(lines, v[1])
			}
		}
	}

	for i, j := 0, len(lines)-1; i < j; i, j = i+1, j-1 {
		lines[i], lines[j] = lines[j], lines[i]
	}
	if len(lines) > limit {
		lines = lines[len(lines)-limit:]
	}

	return &domain.ContainerLogs{ContainerID: fmt.Sprintf("%s/%s", namespace, pod), Lines: lines}, nil
}

func (r *kubernetesRepository) ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error) {
	namespaces, err := r.client.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]domain.NetworkInfo, 0, len(namespaces.Items))
	for _, ns := range namespaces.Items {
		pods, err := r.client.CoreV1().Pods(ns.Name).List(ctx, metav1.ListOptions{})
		podNames := make([]string, 0)
		if err == nil {
			for _, pod := range pods.Items {
				podNames = append(podNames, pod.Name)
			}
		}

		uid := string(ns.UID)
		if len(uid) > 8 {
			uid = uid[:8]
		}

		result = append(result, domain.NetworkInfo{
			ID:         uid,
			Name:       ns.Name,
			Driver:     "kubernetes",
			Containers: podNames,
		})
	}

	return result, nil
}

func (r *kubernetesRepository) GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error) {
	nodes, err := r.client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	version, err := r.client.Discovery().ServerVersion()
	if err != nil {
		return nil, err
	}

	pods, _ := r.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	totalPods, runningPods, stoppedPods := 0, 0, 0
	if pods != nil {
		totalPods = len(pods.Items)
		for _, pod := range pods.Items {
			switch pod.Status.Phase {
			case corev1.PodRunning:
				runningPods++
			case corev1.PodFailed, corev1.PodSucceeded:
				stoppedPods++
			}
		}
	}

	var totalCPU, totalMem int64
	osName, arch := "", ""
	for _, node := range nodes.Items {
		totalCPU += node.Status.Capacity.Cpu().Value()
		totalMem += node.Status.Capacity.Memory().Value()
		if osName == "" {
			osName = node.Status.NodeInfo.OSImage
			arch = node.Status.NodeInfo.Architecture
		}
	}

	ip := ""
	if addrs, err := net.InterfaceAddrs(); err == nil {
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
				ip = ipnet.IP.String()
				break
			}
		}
	}

	return &domain.SystemInfo{
		OS:                osName,
		Architecture:      arch,
		CPUs:              int(totalCPU),
		MemoryTotal:       totalMem,
		KubernetesVersion: version.GitVersion,
		Containers:        totalPods,
		Running:           runningPods,
		Stopped:           stoppedPods,
		IP:                ip,
		PublicIP:          fetchPublicIP(),
	}, nil
}

func (r *kubernetesRepository) ListNodes(ctx context.Context) ([]domain.NodeInfo, error) {
	nodes, err := r.client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	result := make([]domain.NodeInfo, 0, len(nodes.Items))
	for _, node := range nodes.Items {
		role := "worker"
		if _, ok := node.Labels["node-role.kubernetes.io/control-plane"]; ok {
			role = "control-plane"
		} else if _, ok := node.Labels["node-role.kubernetes.io/master"]; ok {
			role = "control-plane"
		}

		status := "Unknown"
		for _, cond := range node.Status.Conditions {
			if cond.Type == "Ready" {
				if cond.Status == "True" {
					status = "Ready"
				} else {
					status = "NotReady"
				}
			}
		}

		cpuCores := node.Status.Capacity.Cpu().Value()
		memBytes := node.Status.Capacity.Memory().Value()
		memGB := float64(memBytes) / (1024 * 1024 * 1024)

		result = append(result, domain.NodeInfo{
			Name:     node.Name,
			Role:     role,
			Status:   status,
			CPUCores: cpuCores,
			MemoryGB: memGB,
			OSImage:  node.Status.NodeInfo.OSImage,
		})
	}
	return result, nil
}

func (r *kubernetesRepository) ListDependencies(ctx context.Context) ([]domain.AppDependency, error) {
	services, err := r.client.CoreV1().Services("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := r.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	type depKey struct{ src, srcNs, tgt, tgtNs string }
	seen := make(map[depKey]bool)
	var deps []domain.AppDependency

	addDep := func(srcApp, srcNs, tgtApp, tgtNs string) {
		if srcApp == tgtApp && srcNs == tgtNs {
			return
		}
		k := depKey{srcApp, srcNs, tgtApp, tgtNs}
		if !seen[k] {
			seen[k] = true
			deps = append(deps, domain.AppDependency{
				SourceApp: srcApp, SourceNamespace: srcNs,
				TargetApp: tgtApp, TargetNamespace: tgtNs,
			})
		}
	}

	matchService := func(value, podNs string) (svcName, svcNs string, ok bool) {
		for _, svc := range services.Items {
			if systemNamespaces[svc.Namespace] {
				continue
			}
			n, ns := svc.Name, svc.Namespace
			if ns == podNs {
				if strings.Contains(value, n+":") || strings.Contains(value, "/"+n+"/") ||
					strings.Contains(value, "@"+n+":") || strings.Contains(value, "@"+n+"/") ||
					strings.HasPrefix(value, n+".") || value == n {
					return n, ns, true
				}
			}
			if strings.Contains(value, n+"."+ns) {
				return n, ns, true
			}
		}
		return "", "", false
	}

	// Build configmap data index: (name, namespace) -> concatenated values
	type cmKey struct{ name, ns string }
	cmData := make(map[cmKey]string)
	if configMaps, err := r.client.CoreV1().ConfigMaps("").List(ctx, metav1.ListOptions{}); err == nil {
		for _, cm := range configMaps.Items {
			if systemNamespaces[cm.Namespace] {
				continue
			}
			var sb strings.Builder
			for _, v := range cm.Data {
				sb.WriteString(v)
				sb.WriteByte('\n')
			}
			cmData[cmKey{cm.Name, cm.Namespace}] = sb.String()
		}
	}

	for _, pod := range pods.Items {
		if systemNamespaces[pod.Namespace] {
			continue
		}
		srcApp := podAppName(pod)

		for _, c := range pod.Spec.Containers {
			for _, env := range c.Env {
				if env.Value == "" {
					continue
				}
				if tgtName, tgtNs, ok := matchService(env.Value, pod.Namespace); ok {
					addDep(srcApp, pod.Namespace, tgtName, tgtNs)
				}
			}
		}

		for _, ic := range pod.Spec.InitContainers {
			cmdStr := strings.Join(append(ic.Command, ic.Args...), " ")
			for _, svc := range services.Items {
				if systemNamespaces[svc.Namespace] || svc.Namespace != pod.Namespace {
					continue
				}
				if strings.Contains(cmdStr, "nc -z "+svc.Name+" ") ||
					strings.Contains(cmdStr, svc.Name+":") {
					addDep(srcApp, pod.Namespace, svc.Name, svc.Namespace)
				}
			}
		}

		// Scan ConfigMaps referenced by this pod's volumes
		for _, vol := range pod.Spec.Volumes {
			if vol.ConfigMap == nil {
				continue
			}
			data, ok := cmData[cmKey{vol.ConfigMap.Name, pod.Namespace}]
			if !ok {
				continue
			}
			for _, svc := range services.Items {
				if systemNamespaces[svc.Namespace] {
					continue
				}
				n, ns := svc.Name, svc.Namespace
				if ns == pod.Namespace {
					if strings.Contains(data, n+":") || strings.Contains(data, "/"+n+"/") ||
						strings.Contains(data, "@"+n+":") || strings.Contains(data, "//"+n) ||
						strings.Contains(data, n+"."+ns) {
						addDep(srcApp, pod.Namespace, n, ns)
					}
				} else if strings.Contains(data, n+"."+ns) {
					addDep(srcApp, pod.Namespace, n, ns)
				}
			}
		}
	}

	return deps, nil
}

func parseID(id string) (namespace, podName string, err error) {
	parts := strings.SplitN(id, "/", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid ID %q: expected namespace/pod-name", id)
	}
	return parts[0], parts[1], nil
}

func podStateAndStatus(pod corev1.Pod) (state, status string) {
	state = strings.ToLower(string(pod.Status.Phase))
	status = pod.Status.Message
	if status == "" {
		status = string(pod.Status.Phase)
	}
	return
}

func podAppName(pod corev1.Pod) string {
	for _, key := range []string{"app.kubernetes.io/name", "app", "app.kubernetes.io/component"} {
		if v := pod.Labels[key]; v != "" {
			return v
		}
	}
	// Fallback: strip replicaset/pod hash suffixes from pod name
	name := pod.Name
	// StatefulSet: strip trailing -N
	if idx := strings.LastIndex(name, "-"); idx != -1 {
		suffix := name[idx+1:]
		allDigits := true
		for _, c := range suffix {
			if c < '0' || c > '9' {
				allDigits = false
				break
			}
		}
		if allDigits && len(suffix) > 0 {
			name = name[:idx]
		}
	}
	// Deployment: strip -{replicaset}-{pod} hash (two 5-10 char alphanum suffixes)
	for i := 0; i < 2; i++ {
		idx := strings.LastIndex(name, "-")
		if idx == -1 {
			break
		}
		suffix := name[idx+1:]
		if len(suffix) >= 5 && len(suffix) <= 12 {
			name = name[:idx]
		} else {
			break
		}
	}
	return name
}

func podHealth(pod corev1.Pod) string {
	for _, cond := range pod.Status.Conditions {
		if cond.Type == corev1.PodReady {
			if cond.Status == corev1.ConditionTrue {
				return "healthy"
			}
			return "unhealthy"
		}
	}
	return ""
}

func fetchPublicIP() string {
	resp, err := http.Get("https://api.ipify.org?format=json") //nolint:noctx
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var result struct {
		IP string `json:"ip"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return ""
	}
	return result.IP
}
