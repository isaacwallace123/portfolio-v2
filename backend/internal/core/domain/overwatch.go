package domain

import "time"

type OverwatchAnomaly struct {
	Severity    string `json:"severity"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Affected    string `json:"affected"`
}

type OverwatchInsight struct {
	ID              *int               `json:"id,omitempty"`
	CollectedAt     *time.Time         `json:"collected_at"`
	Status          string             `json:"status"`
	Summary         string             `json:"summary"`
	Anomalies       []OverwatchAnomaly `json:"anomalies"`
	Recommendations []string           `json:"recommendations"`
}
