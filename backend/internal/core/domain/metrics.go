package domain

type MetricPoint struct {
	Time  string  `json:"time"`
	Value float64 `json:"value"`
}

type MetricsRange struct {
	CPU    []MetricPoint `json:"cpu"`
	Memory []MetricPoint `json:"memory"`
	Disk   []MetricPoint `json:"disk"`
}
