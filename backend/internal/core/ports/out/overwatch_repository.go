package out

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
)

type OverwatchRepository interface {
	GetInsights(ctx context.Context) (*domain.OverwatchInsight, error)
}
