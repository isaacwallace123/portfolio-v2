package domain

import "time"

type ContainerInfo struct {
	ID       string        `json:"id"`
	Name     string        `json:"name"`
	Image    string        `json:"image"`
	State    string        `json:"state"`
	Status   string        `json:"status"`
	Health   string        `json:"health"`
	Networks []string      `json:"networks"`
	Ports    []PortBinding `json:"ports"`
	Created  time.Time     `json:"created"`
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
