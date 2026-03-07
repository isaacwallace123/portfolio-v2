package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type kubernetesRepository struct {
	client        *kubernetes.Clientset
	metricsClient *metricsv1beta1.Clientset
}

func NewKubernetesRepository(client *kubernetes.Clientset, metricsClient *metricsv1beta1.Clientset) portout.ClusterRepository {
	return &kubernetesRepository{client: client, metricsClient: metricsClient}
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

		result = append(result, domain.ContainerInfo{
			ID:       fmt.Sprintf("%s/%s", pod.Namespace, pod.Name),
			Name:     pod.Name,
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

	tailLines := int64(50)
	if n, err := strconv.ParseInt(tail, 10, 64); err == nil && n > 0 {
		tailLines = n
	}

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

	return &domain.ContainerLogs{
		ContainerID: id,
		Lines:       lines,
	}, nil
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
