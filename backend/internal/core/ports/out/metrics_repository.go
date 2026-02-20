package out

import (
	"context"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
)

type MetricsRepository interface {
	GetNodeMetrics(ctx context.Context) (map[string]interface{}, error)
	GetMetricsRange(ctx context.Context, duration, containerName string) (*domain.MetricsRange, error)
}
