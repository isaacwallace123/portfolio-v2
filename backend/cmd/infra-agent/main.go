package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/client"
	httpadapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/in/http"
	dockeradapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/out/docker"
	prometheusadapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/out/prometheus"
	"github.com/isaacwallace123/portfolio-infra/internal/service"
)

func main() {
	apiKey := os.Getenv("INFRA_API_KEY")
	promURL := strings.TrimRight(os.Getenv("PROMETHEUS_URL"), "/")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dockerClient, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Failed to create Docker client: %v", err)
	}
	defer dockerClient.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := dockerClient.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to Docker daemon: %v", err)
	}
	log.Println("Connected to Docker daemon")

	dockerRepo := dockeradapter.NewDockerRepository(dockerClient)
	metricsRepo := prometheusadapter.NewPrometheusRepository(promURL)
	infraSvc := service.NewInfraService(dockerRepo, metricsRepo)

	handler := httpadapter.NewHandler(infraSvc)
	router := httpadapter.NewRouter(handler, apiKey)
	server := httpadapter.NewServer(port, router)

	log.Printf("Infra agent listening on :%s", port)
	if err := server.Run(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
