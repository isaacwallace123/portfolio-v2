package in

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
)

type InfraService interface {
	Health(ctx context.Context) error
	ListContainers(ctx context.Context) ([]domain.ContainerInfo, error)
	GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error)
	GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error)
	ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error)
	GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error)
	GetNodeMetrics(ctx context.Context) (map[string]interface{}, error)
	GetMetricsRange(ctx context.Context, duration, containerName string) (*domain.MetricsRange, error)
}
