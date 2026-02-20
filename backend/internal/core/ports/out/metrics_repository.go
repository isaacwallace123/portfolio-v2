package out

import "context"

type MetricsRepository interface {
	GetNodeMetrics(ctx context.Context) (map[string]interface{}, error)
}
