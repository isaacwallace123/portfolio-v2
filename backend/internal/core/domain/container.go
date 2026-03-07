package domain

import "time"

type ContainerInfo struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	AppName  string            `json:"appName"`
	Labels   map[string]string `json:"labels"`
	Image    string            `json:"image"`
	State    string            `json:"state"`
	Status   string            `json:"status"`
	Health   string            `json:"health"`
	Networks []string          `json:"networks"`
	Ports    []PortBinding     `json:"ports"`
	Created  time.Time         `json:"created"`
}

type PortBinding struct {
	PrivatePort uint16 `json:"privatePort"`
	PublicPort  uint16 `json:"publicPort,omitempty"`
	Type        string `json:"type"`
}

type ContainerStats struct {
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryUsage   uint64  `json:"memoryUsage"`
	MemoryLimit   uint64  `json:"memoryLimit"`
	MemoryPercent float64 `json:"memoryPercent"`
}

type ContainerLogs struct {
	ContainerID string   `json:"containerId"`
	Lines       []string `json:"lines"`
}

type AppDependency struct {
	SourceApp       string `json:"sourceApp"`
	SourceNamespace string `json:"sourceNamespace"`
	TargetApp       string `json:"targetApp"`
	TargetNamespace string `json:"targetNamespace"`
}

type NodeInfo struct {
	Name      string  `json:"name"`
	Role      string  `json:"role"`
	Status    string  `json:"status"`
	CPUCores  int64   `json:"cpuCores"`
	MemoryGB  float64 `json:"memoryGB"`
	OSImage   string  `json:"osImage"`
}
