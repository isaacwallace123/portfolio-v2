package service

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portin "github.com/isaacwallace123/portfolio-infra/internal/core/ports/in"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type infraService struct {
	docker  portout.DockerRepository
	metrics portout.MetricsRepository
}

func NewInfraService(docker portout.DockerRepository, metrics portout.MetricsRepository) portin.InfraService {
	return &infraService{
		docker:  docker,
		metrics: metrics,
	}
}

func (s *infraService) Health(ctx context.Context) error {
	return s.docker.Ping(ctx)
}

func (s *infraService) ListContainers(ctx context.Context) ([]domain.ContainerInfo, error) {
	return s.docker.ListContainers(ctx)
}

func (s *infraService) GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error) {
	return s.docker.GetContainerStats(ctx, id)
}

func (s *infraService) GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error) {
	return s.docker.GetContainerLogs(ctx, id, tail)
}

func (s *infraService) ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error) {
	return s.docker.ListNetworks(ctx)
}

func (s *infraService) GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error) {
	return s.docker.GetSystemInfo(ctx)
}

func (s *infraService) GetNodeMetrics(ctx context.Context) (map[string]interface{}, error) {
	return s.metrics.GetNodeMetrics(ctx)
}
