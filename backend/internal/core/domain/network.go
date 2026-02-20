package domain

type NetworkInfo struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Driver     string   `json:"driver"`
	Containers []string `json:"containers"`
}
