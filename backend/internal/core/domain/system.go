package domain

type SystemInfo struct {
	OS            string `json:"os"`
	Architecture  string `json:"architecture"`
	CPUs          int    `json:"cpus"`
	MemoryTotal   int64  `json:"memoryTotal"`
	DockerVersion string `json:"dockerVersion"`
	Containers    int    `json:"containers"`
	Running       int    `json:"running"`
	Stopped       int    `json:"stopped"`
	IP            string `json:"ip"`
	PublicIP      string `json:"publicIP"`
}
