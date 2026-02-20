package prometheus

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
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
		"cpu":           `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`,
		"memory":        `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100`,
		"disk":          `(1 - node_filesystem_avail_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"}) * 100`,
		"uptime":        `node_time_seconds - node_boot_time_seconds`,
		"totalMemory":   `node_memory_MemTotal_bytes`,
		"diskReadRate":  `sum(rate(node_disk_read_bytes_total{device!~"loop.*|sr.*"}[5m]))`,
		"diskWriteRate": `sum(rate(node_disk_written_bytes_total{device!~"loop.*|sr.*"}[5m]))`,
		"networkRxRate": `sum(rate(node_network_receive_bytes_total{device!~"lo|docker.*|br-.*|veth.*"}[5m]))`,
		"networkTxRate": `sum(rate(node_network_transmit_bytes_total{device!~"lo|docker.*|br-.*|veth.*"}[5m]))`,
	}

	results := make(map[string]interface{})
	for name, query := range queries {
		val, err := r.queryInstant(ctx, query)
		if err != nil {
			results[name] = nil
			continue
		}
		results[name] = val
	}

	return results, nil
}

// GetMetricsRange returns CPU and memory time-series for either a specific container
// (using cAdvisor metrics) or the host (using node_exporter metrics).
// containerName matches the Docker container name, e.g. "portfolio_frontend".
// duration must be one of: "5m", "15m", "1h", "24h".
func (r *prometheusRepository) GetMetricsRange(ctx context.Context, duration, containerName string) (*domain.MetricsRange, error) {
	if r.baseURL == "" {
		return nil, fmt.Errorf("prometheus not configured")
	}

	type rangeCfg struct {
		window  time.Duration
		step    string
		rateWin string
	}

	cfgs := map[string]rangeCfg{
		"5m":  {5 * time.Minute, "10s", "1m"},
		"15m": {15 * time.Minute, "15s", "1m"},
		"1h":  {60 * time.Minute, "60s", "5m"},
		"24h": {24 * time.Hour, "1440s", "15m"},
	}

	cfg, ok := cfgs[duration]
	if !ok {
		cfg = cfgs["5m"]
	}

	now := time.Now()
	start := now.Add(-cfg.window)

	var cpuQuery, memQuery string

	if containerName != "" {
		// cAdvisor per-container metrics.
		// name=~"/?CONTAINER_NAME" matches both "/portfolio_frontend" (older Docker)
		// and "portfolio_frontend" (newer Docker Compose v2).
		// CPU normalised to 0-100% across all machine CPUs.
		cpuQuery = fmt.Sprintf(
			`sum(rate(container_cpu_usage_seconds_total{name=~"/?%s", image!=""}[%s])) / scalar(count(node_cpu_seconds_total{mode="idle"})) * 100`,
			containerName, cfg.rateWin,
		)
		// Memory: working set bytes as % of total machine memory.
		memQuery = fmt.Sprintf(
			`container_memory_working_set_bytes{name=~"/?%s", image!=""} / scalar(node_memory_MemTotal_bytes) * 100`,
			containerName,
		)
	} else {
		// Host-level metrics via node_exporter.
		cpuQuery = fmt.Sprintf(`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[%s])) * 100)`, cfg.rateWin)
		memQuery = `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100`
	}

	cpuPoints, err := r.queryRange(ctx, cpuQuery, start, now, cfg.step)
	if err != nil {
		cpuPoints = []domain.MetricPoint{}
	}

	memPoints, err := r.queryRange(ctx, memQuery, start, now, cfg.step)
	if err != nil {
		memPoints = []domain.MetricPoint{}
	}

	// Disk % and I/O rates are host-level only; return empty for container-specific queries.
	var diskPoints, networkRxPoints, networkTxPoints, diskReadPoints, diskWritePoints []domain.MetricPoint
	if containerName == "" {
		diskQuery := `(1 - node_filesystem_avail_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint=~"/|/mnt/user|/mnt/cache",fstype!="tmpfs"}) * 100`
		diskPoints, err = r.queryRange(ctx, diskQuery, start, now, cfg.step)
		if err != nil {
			diskPoints = []domain.MetricPoint{}
		}

		networkRxQuery := fmt.Sprintf(`sum(rate(node_network_receive_bytes_total{device!~"lo|docker.*|br-.*|veth.*"}[%s]))`, cfg.rateWin)
		networkRxPoints, err = r.queryRange(ctx, networkRxQuery, start, now, cfg.step)
		if err != nil {
			networkRxPoints = []domain.MetricPoint{}
		}

		networkTxQuery := fmt.Sprintf(`sum(rate(node_network_transmit_bytes_total{device!~"lo|docker.*|br-.*|veth.*"}[%s]))`, cfg.rateWin)
		networkTxPoints, err = r.queryRange(ctx, networkTxQuery, start, now, cfg.step)
		if err != nil {
			networkTxPoints = []domain.MetricPoint{}
		}

		diskReadQuery := fmt.Sprintf(`sum(rate(node_disk_read_bytes_total{device!~"loop.*|sr.*"}[%s]))`, cfg.rateWin)
		diskReadPoints, err = r.queryRange(ctx, diskReadQuery, start, now, cfg.step)
		if err != nil {
			diskReadPoints = []domain.MetricPoint{}
		}

		diskWriteQuery := fmt.Sprintf(`sum(rate(node_disk_written_bytes_total{device!~"loop.*|sr.*"}[%s]))`, cfg.rateWin)
		diskWritePoints, err = r.queryRange(ctx, diskWriteQuery, start, now, cfg.step)
		if err != nil {
			diskWritePoints = []domain.MetricPoint{}
		}
	} else {
		diskPoints = []domain.MetricPoint{}
		networkRxPoints = []domain.MetricPoint{}
		networkTxPoints = []domain.MetricPoint{}
		diskReadPoints = []domain.MetricPoint{}
		diskWritePoints = []domain.MetricPoint{}
	}

	return &domain.MetricsRange{
		CPU:       cpuPoints,
		Memory:    memPoints,
		Disk:      diskPoints,
		NetworkRx: networkRxPoints,
		NetworkTx: networkTxPoints,
		DiskRead:  diskReadPoints,
		DiskWrite: diskWritePoints,
	}, nil
}

// queryInstant executes an instant Prometheus query and returns the first scalar result.
func (r *prometheusRepository) queryInstant(ctx context.Context, query string) (float64, error) {
	endpoint := fmt.Sprintf("%s/api/v1/query?query=%s", r.baseURL, url.QueryEscape(query))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return 0, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
		Data   struct {
			Result []struct {
				Value []interface{} `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || result.Status != "success" {
		return 0, fmt.Errorf("invalid prometheus response")
	}
	if len(result.Data.Result) == 0 || len(result.Data.Result[0].Value) < 2 {
		return 0, fmt.Errorf("no data")
	}

	valStr, ok := result.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("unexpected value type")
	}
	return strconv.ParseFloat(valStr, 64)
}

// queryRange executes a Prometheus range query and returns time-series points.
func (r *prometheusRepository) queryRange(ctx context.Context, query string, start, end time.Time, step string) ([]domain.MetricPoint, error) {
	params := url.Values{}
	params.Set("query", query)
	params.Set("start", strconv.FormatInt(start.Unix(), 10))
	params.Set("end", strconv.FormatInt(end.Unix(), 10))
	params.Set("step", step)

	endpoint := fmt.Sprintf("%s/api/v1/query_range?%s", r.baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
		Data   struct {
			Result []struct {
				Values [][]interface{} `json:"values"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || result.Status != "success" {
		return nil, fmt.Errorf("invalid prometheus range response")
	}
	if len(result.Data.Result) == 0 {
		return []domain.MetricPoint{}, nil
	}

	points := make([]domain.MetricPoint, 0, len(result.Data.Result[0].Values))
	for _, pair := range result.Data.Result[0].Values {
		if len(pair) < 2 {
			continue
		}
		ts, ok := pair[0].(float64)
		if !ok {
			continue
		}
		valStr, ok := pair[1].(string)
		if !ok {
			continue
		}
		val, err := strconv.ParseFloat(valStr, 64)
		if err != nil {
			continue
		}
		points = append(points, domain.MetricPoint{
			Time:  time.Unix(int64(ts), 0).Format("15:04:05"),
			Value: val,
		})
	}
	return points, nil
}
