package docker

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type dockerRepository struct {
	client *client.Client
}

func NewDockerRepository(c *client.Client) portout.DockerRepository {
	return &dockerRepository{client: c}
}

func (r *dockerRepository) Ping(ctx context.Context) error {
	_, err := r.client.Ping(ctx)
	return err
}

func (r *dockerRepository) ListContainers(ctx context.Context) ([]domain.ContainerInfo, error) {
	containers, err := r.client.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}

	result := make([]domain.ContainerInfo, 0, len(containers))
	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}

		health := ""
		if c.State == "running" {
			inspect, err := r.client.ContainerInspect(ctx, c.ID)
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

		ports := make([]domain.PortBinding, 0)
		for _, p := range c.Ports {
			ports = append(ports, domain.PortBinding{
				PrivatePort: p.PrivatePort,
				PublicPort:  p.PublicPort,
				Type:        p.Type,
			})
		}

		result = append(result, domain.ContainerInfo{
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

	return result, nil
}

func (r *dockerRepository) GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error) {
	stats, err := r.client.ContainerStats(ctx, id, false)
	if err != nil {
		return nil, err
	}
	defer stats.Body.Close()

	var statsJSON container.StatsResponse
	if err := json.NewDecoder(stats.Body).Decode(&statsJSON); err != nil {
		return nil, err
	}

	cpuDelta := float64(statsJSON.CPUStats.CPUUsage.TotalUsage - statsJSON.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(statsJSON.CPUStats.SystemUsage - statsJSON.PreCPUStats.SystemUsage)
	cpuPercent := 0.0
	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * float64(statsJSON.CPUStats.OnlineCPUs) * 100.0
	}

	memUsage := statsJSON.MemoryStats.Usage - statsJSON.MemoryStats.Stats["cache"]
	memLimit := statsJSON.MemoryStats.Limit
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = float64(memUsage) / float64(memLimit) * 100.0
	}

	return &domain.ContainerStats{
		CPUPercent:    cpuPercent,
		MemoryUsage:   memUsage,
		MemoryLimit:   memLimit,
		MemoryPercent: memPercent,
	}, nil
}

func (r *dockerRepository) GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error) {
	if tail == "" {
		tail = "50"
	}

	logs, err := r.client.ContainerLogs(ctx, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       tail,
		Timestamps: true,
	})
	if err != nil {
		return nil, err
	}
	defer logs.Close()

	raw, err := io.ReadAll(logs)
	if err != nil {
		return nil, err
	}

	return &domain.ContainerLogs{
		ContainerID: id,
		Lines:       parseDockerLogs(raw),
	}, nil
}

func (r *dockerRepository) ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error) {
	networks, err := r.client.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]domain.NetworkInfo, 0)
	for _, n := range networks {
		if n.Name == "bridge" || n.Name == "host" || n.Name == "none" {
			continue
		}

		containerNames := make([]string, 0)
		inspected, err := r.client.NetworkInspect(ctx, n.ID, network.InspectOptions{})
		if err == nil {
			for _, endpoint := range inspected.Containers {
				containerNames = append(containerNames, endpoint.Name)
			}
		}

		result = append(result, domain.NetworkInfo{
			ID:         n.ID[:12],
			Name:       n.Name,
			Driver:     n.Driver,
			Containers: containerNames,
		})
	}

	return result, nil
}

func (r *dockerRepository) GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error) {
	info, err := r.client.Info(ctx)
	if err != nil {
		return nil, err
	}

	version, _ := r.client.ServerVersion(ctx)

	ip := ""
	if addrs, err := net.InterfaceAddrs(); err == nil {
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
				ip = ipnet.IP.String()
				break
			}
		}
	}

	publicIP := fetchPublicIP()

	return &domain.SystemInfo{
		OS:            info.OperatingSystem,
		Architecture:  info.Architecture,
		CPUs:          info.NCPU,
		MemoryTotal:   info.MemTotal,
		DockerVersion: version.Version,
		Containers:    info.Containers,
		Running:       info.ContainersRunning,
		Stopped:       info.ContainersStopped,
		IP:            ip,
		PublicIP:      publicIP,
	}, nil
}

// fetchPublicIP returns the public IP by calling api.ipify.org; returns "" on failure.
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

// parseDockerLogs parses Docker's multiplexed log stream format (8-byte header + payload).
func parseDockerLogs(raw []byte) []string {
	lines := make([]string, 0)
	for len(raw) > 0 {
		if len(raw) < 8 {
			appendLines(&lines, string(raw))
			break
		}

		frameSize := int(raw[4])<<24 | int(raw[5])<<16 | int(raw[6])<<8 | int(raw[7])
		if frameSize <= 0 || 8+frameSize > len(raw) {
			appendLines(&lines, string(raw))
			break
		}

		appendLines(&lines, string(raw[8:8+frameSize]))
		raw = raw[8+frameSize:]
	}
	return lines
}

func appendLines(dst *[]string, text string) {
	for _, line := range strings.Split(strings.TrimSpace(text), "\n") {
		if trimmed := strings.TrimSpace(line); trimmed != "" {
			*dst = append(*dst, trimmed)
		}
	}
}
