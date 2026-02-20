package out

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
)

type DockerRepository interface {
	Ping(ctx context.Context) error
	ListContainers(ctx context.Context) ([]domain.ContainerInfo, error)
	GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error)
	GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error)
	ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error)
	GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error)
}
