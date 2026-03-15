package service

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portin "github.com/isaacwallace123/portfolio-infra/internal/core/ports/in"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type infraService struct {
	cluster   portout.ClusterRepository
	metrics   portout.MetricsRepository
	overwatch portout.OverwatchRepository
}

func NewInfraService(cluster portout.ClusterRepository, metrics portout.MetricsRepository, overwatch portout.OverwatchRepository) portin.InfraService {
	return &infraService{
		cluster:   cluster,
		metrics:   metrics,
		overwatch: overwatch,
	}
}

func (s *infraService) Health(ctx context.Context) error {
	return s.cluster.Ping(ctx)
}

func (s *infraService) ListContainers(ctx context.Context) ([]domain.ContainerInfo, error) {
	return s.cluster.ListContainers(ctx)
}

func (s *infraService) GetContainerStats(ctx context.Context, id string) (*domain.ContainerStats, error) {
	return s.cluster.GetContainerStats(ctx, id)
}

func (s *infraService) GetContainerLogs(ctx context.Context, id, tail string) (*domain.ContainerLogs, error) {
	return s.cluster.GetContainerLogs(ctx, id, tail)
}

func (s *infraService) ListNetworks(ctx context.Context) ([]domain.NetworkInfo, error) {
	return s.cluster.ListNetworks(ctx)
}

func (s *infraService) GetSystemInfo(ctx context.Context) (*domain.SystemInfo, error) {
	return s.cluster.GetSystemInfo(ctx)
}

func (s *infraService) GetNodeMetrics(ctx context.Context) (map[string]interface{}, error) {
	return s.metrics.GetNodeMetrics(ctx)
}

func (s *infraService) GetMetricsRange(ctx context.Context, duration, containerName string) (*domain.MetricsRange, error) {
	return s.metrics.GetMetricsRange(ctx, duration, containerName)
}

func (s *infraService) GetNodeMetricsRange(ctx context.Context, node, duration string) (*domain.MetricsRange, error) {
	return s.metrics.GetNodeMetricsRange(ctx, node, duration)
}

func (s *infraService) ListDependencies(ctx context.Context) ([]domain.AppDependency, error) {
	return s.cluster.ListDependencies(ctx)
}

func (s *infraService) ListNodes(ctx context.Context) ([]domain.NodeInfo, error) {
	return s.cluster.ListNodes(ctx)
}

func (s *infraService) GetOverwatchInsights(ctx context.Context) (*domain.OverwatchInsight, error) {
	return s.overwatch.GetInsights(ctx)
}

func (s *infraService) GetPodInsights(ctx context.Context, namespace, app string) (*domain.PodInsight, error) {
	return s.overwatch.GetPodInsights(ctx, namespace, app)
}

func (s *infraService) GetOverwatchHistory(ctx context.Context) ([]domain.OverwatchInsight, error) {
	return s.overwatch.GetHistory(ctx)
}
