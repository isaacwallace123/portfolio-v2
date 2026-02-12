package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
)

var (
	dockerClient *client.Client
	apiKey       string
	promURL      string
)

// ---------- Types ----------

type ContainerInfo struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Image    string            `json:"image"`
	State    string            `json:"state"`
	Status   string            `json:"status"`
	Health   string            `json:"health"`
	Networks []string          `json:"networks"`
	Ports    []PortBinding     `json:"ports"`
	Created  time.Time         `json:"created"`
}

type PortBinding struct {
	PrivatePort uint16 `json:"privatePort"`
	PublicPort  uint16 `json:"publicPort,omitempty"`
	Type        string `json:"type"`
}

type ContainerStats struct {
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryUsage   uint64  `json:"memoryUsage"`
	MemoryLimit   uint64  `json:"memoryLimit"`
	MemoryPercent float64 `json:"memoryPercent"`
}

type NetworkInfo struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Driver     string   `json:"driver"`
	Containers []string `json:"containers"`
}

type SystemInfo struct {
	OS            string `json:"os"`
	Architecture  string `json:"architecture"`
	CPUs          int    `json:"cpus"`
	MemoryTotal   int64  `json:"memoryTotal"`
	DockerVersion string `json:"dockerVersion"`
	Containers    int    `json:"containers"`
	Running       int    `json:"running"`
	Stopped       int    `json:"stopped"`
}

// ---------- Middleware ----------

func apiKeyMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if apiKey != "" {
			key := r.Header.Get("X-API-Key")
			if key != apiKey {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
		}
		next(w, r)
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// ---------- Handlers ----------

func healthHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err := dockerClient.Ping(ctx)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "healthy"})
}

func containersHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	containers, err := dockerClient.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	result := make([]ContainerInfo, 0, len(containers))
	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}

		health := ""
		if c.State == "running" {
			// Inspect for health check details
			inspect, err := dockerClient.ContainerInspect(ctx, c.ID)
			if err == nil && inspect.State.Health != nil {
				health = string(inspect.State.Health.Status)
			}
		}

		networks := make([]string, 0)
		if c.NetworkSettings != nil {
			for netName := range c.NetworkSettings.Networks {
				networks = append(networks, netName)
			}
		}

		ports := make([]PortBinding, 0)
		for _, p := range c.Ports {
			ports = append(ports, PortBinding{
				PrivatePort: p.PrivatePort,
				PublicPort:  p.PublicPort,
				Type:        p.Type,
			})
		}

		result = append(result, ContainerInfo{
			ID:       c.ID[:12],
			Name:     name,
			Image:    c.Image,
			State:    c.State,
			Status:   c.Status,
			Health:   health,
			Networks: networks,
			Ports:    ports,
			Created:  time.Unix(c.Created, 0),
		})
	}

	writeJSON(w, http.StatusOK, result)
}

func containerStatsHandler(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/containers/", "/stats")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "container ID required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	stats, err := dockerClient.ContainerStats(ctx, id, false)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer stats.Body.Close()

	var statsJSON container.StatsResponse
	if err := json.NewDecoder(stats.Body).Decode(&statsJSON); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to decode stats"})
		return
	}

	// Calculate CPU percentage
	cpuDelta := float64(statsJSON.CPUStats.CPUUsage.TotalUsage - statsJSON.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(statsJSON.CPUStats.SystemUsage - statsJSON.PreCPUStats.SystemUsage)
	cpuPercent := 0.0
	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * float64(statsJSON.CPUStats.OnlineCPUs) * 100.0
	}

	// Calculate memory percentage
	memUsage := statsJSON.MemoryStats.Usage - statsJSON.MemoryStats.Stats["cache"]
	memLimit := statsJSON.MemoryStats.Limit
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = float64(memUsage) / float64(memLimit) * 100.0
	}

	writeJSON(w, http.StatusOK, ContainerStats{
		CPUPercent:    cpuPercent,
		MemoryUsage:   memUsage,
		MemoryLimit:   memLimit,
		MemoryPercent: memPercent,
	})
}

func containerLogsHandler(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/containers/", "/logs")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "container ID required"})
		return
	}

	tail := r.URL.Query().Get("tail")
	if tail == "" {
		tail = "50"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	logs, err := dockerClient.ContainerLogs(ctx, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       tail,
		Timestamps: true,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer logs.Close()

	raw, err := io.ReadAll(logs)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to read logs"})
		return
	}

	// Docker log lines have an 8-byte header prefix for multiplexed streams
	lines := parseDockerLogs(raw)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"containerId": id,
		"lines":       lines,
	})
}

func networksHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	networks, err := dockerClient.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	result := make([]NetworkInfo, 0)
	for _, n := range networks {
		// Skip default Docker networks
		if n.Name == "bridge" || n.Name == "host" || n.Name == "none" {
			continue
		}

		containerNames := make([]string, 0)
		// Inspect the network to get connected containers by name
		inspected, err := dockerClient.NetworkInspect(ctx, n.ID, network.InspectOptions{})
		if err == nil {
			for _, endpoint := range inspected.Containers {
				containerNames = append(containerNames, endpoint.Name)
			}
		}

		result = append(result, NetworkInfo{
			ID:         n.ID[:12],
			Name:       n.Name,
			Driver:     n.Driver,
			Containers: containerNames,
		})
	}

	writeJSON(w, http.StatusOK, result)
}

func systemHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	info, err := dockerClient.Info(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	version, _ := dockerClient.ServerVersion(ctx)

	writeJSON(w, http.StatusOK, SystemInfo{
		OS:            info.OperatingSystem,
		Architecture:  info.Architecture,
		CPUs:          info.NCPU,
		MemoryTotal:   info.MemTotal,
		DockerVersion: version.Version,
		Containers:    info.Containers,
		Running:       info.ContainersRunning,
		Stopped:       info.ContainersStopped,
	})
}

func metricsNodeHandler(w http.ResponseWriter, r *http.Request) {
	if promURL == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "Prometheus not configured"})
		return
	}

	queries := map[string]string{
		"cpu":    `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`,
		"memory": `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100`,
		"disk":  `(1 - node_filesystem_avail_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"}) * 100`,
		"uptime": `node_time_seconds - node_boot_time_seconds`,
	}

	results := make(map[string]interface{})

	for name, query := range queries {
		url := fmt.Sprintf("%s/api/v1/query?query=%s", promURL, query)
		resp, err := http.Get(url)
		if err != nil {
			results[name] = nil
			continue
		}
		defer resp.Body.Close()

		var promResp struct {
			Status string `json:"status"`
			Data   struct {
				Result []struct {
					Value []interface{} `json:"value"`
				} `json:"result"`
			} `json:"data"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&promResp); err != nil || promResp.Status != "success" {
			results[name] = nil
			continue
		}

		if len(promResp.Data.Result) > 0 && len(promResp.Data.Result[0].Value) > 1 {
			if valStr, ok := promResp.Data.Result[0].Value[1].(string); ok {
				val, err := strconv.ParseFloat(valStr, 64)
				if err == nil {
					results[name] = val
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, results)
}

// ---------- Helpers ----------

func extractPathParam(path, prefix, suffix string) string {
	// Extract the segment between prefix and suffix
	// e.g., /containers/abc123/stats → abc123
	start := strings.Index(path, prefix)
	if start == -1 {
		return ""
	}
	rest := path[start+len(prefix):]
	end := strings.Index(rest, suffix)
	if end == -1 {
		return rest
	}
	return rest[:end]
}

func parseDockerLogs(raw []byte) []string {
	lines := make([]string, 0)
	for len(raw) > 0 {
		// Docker multiplexed log format: 8-byte header + payload
		if len(raw) < 8 {
			// Might be plain text logs (not multiplexed)
			remaining := strings.TrimSpace(string(raw))
			if remaining != "" {
				for _, line := range strings.Split(remaining, "\n") {
					trimmed := strings.TrimSpace(line)
					if trimmed != "" {
						lines = append(lines, trimmed)
					}
				}
			}
			break
		}

		// Read frame size from header bytes 4-7 (big-endian uint32)
		frameSize := int(raw[4])<<24 | int(raw[5])<<16 | int(raw[6])<<8 | int(raw[7])

		if frameSize <= 0 || 8+frameSize > len(raw) {
			// Fallback: treat as plain text
			remaining := strings.TrimSpace(string(raw))
			if remaining != "" {
				for _, line := range strings.Split(remaining, "\n") {
					trimmed := strings.TrimSpace(line)
					if trimmed != "" {
						lines = append(lines, trimmed)
					}
				}
			}
			break
		}

		payload := string(raw[8 : 8+frameSize])
		for _, line := range strings.Split(payload, "\n") {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" {
				lines = append(lines, trimmed)
			}
		}

		raw = raw[8+frameSize:]
	}

	return lines
}

// ---------- Router ----------

func main() {
	apiKey = os.Getenv("INFRA_API_KEY")
	promURL = strings.TrimRight(os.Getenv("PROMETHEUS_URL"), "/")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Docker client
	var err error
	dockerClient, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Failed to create Docker client: %v", err)
	}
	defer dockerClient.Close()

	// Verify Docker connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := dockerClient.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to Docker daemon: %v", err)
	}
	log.Println("Connected to Docker daemon")

	mux := http.NewServeMux()

	// Health check (no auth)
	mux.HandleFunc("/health", corsMiddleware(healthHandler))

	// Authenticated endpoints
	mux.HandleFunc("/containers", corsMiddleware(apiKeyMiddleware(containersHandler)))
	mux.HandleFunc("/containers/", corsMiddleware(apiKeyMiddleware(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/stats"):
			containerStatsHandler(w, r)
		case strings.HasSuffix(path, "/logs"):
			containerLogsHandler(w, r)
		default:
			http.NotFound(w, r)
		}
	})))
	mux.HandleFunc("/networks", corsMiddleware(apiKeyMiddleware(networksHandler)))
	mux.HandleFunc("/system", corsMiddleware(apiKeyMiddleware(systemHandler)))
	mux.HandleFunc("/metrics/node", corsMiddleware(apiKeyMiddleware(metricsNodeHandler)))

	log.Printf("Infra agent listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
