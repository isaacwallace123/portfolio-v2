package domain

type MetricPoint struct {
	Time  string  `json:"time"`
	Value float64 `json:"value"`
}

type MetricsRange struct {
	CPU       []MetricPoint `json:"cpu"`
	Memory    []MetricPoint `json:"memory"`
	Disk      []MetricPoint `json:"disk"`
	NetworkRx []MetricPoint `json:"networkRx"`
	NetworkTx []MetricPoint `json:"networkTx"`
	DiskRead  []MetricPoint `json:"diskRead"`
	DiskWrite []MetricPoint `json:"diskWrite"`
}
