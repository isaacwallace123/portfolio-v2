package out

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
)

type OverwatchRepository interface {
	GetInsights(ctx context.Context) (*domain.OverwatchInsight, error)
	GetPodInsights(ctx context.Context, namespace, app string) (*domain.PodInsight, error)
	GetAllPodInsights(ctx context.Context) ([]domain.PodInsight, error)
	GetHistory(ctx context.Context) ([]domain.OverwatchInsight, error)
}
