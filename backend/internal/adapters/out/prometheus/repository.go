package prometheus

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type prometheusRepository struct {
	baseURL string
}

func NewPrometheusRepository(baseURL string) portout.MetricsRepository {
	return &prometheusRepository{baseURL: baseURL}
}

func (r *prometheusRepository) GetNodeMetrics(ctx context.Context) (map[string]interface{}, error) {
	if r.baseURL == "" {
		return nil, fmt.Errorf("prometheus not configured")
	}

	queries := map[string]string{
		"cpu":    `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`,
		"memory": `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100`,
		"disk":   `(1 - node_filesystem_avail_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"}) * 100`,
		"uptime": `node_time_seconds - node_boot_time_seconds`,
	}

	results := make(map[string]interface{})

	for name, query := range queries {
		url := fmt.Sprintf("%s/api/v1/query?query=%s", r.baseURL, query)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			results[name] = nil
			continue
		}

		resp, err := http.DefaultClient.Do(req)
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
				if val, err := strconv.ParseFloat(valStr, 64); err == nil {
					results[name] = val
				}
			}
		}
	}

	return results, nil
}
