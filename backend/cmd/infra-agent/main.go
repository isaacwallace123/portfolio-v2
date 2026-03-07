package main

import (
	"log"
	"os"
	"strings"

	httpadapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/in/http"
	k8sadapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/out/kubernetes"
	prometheusadapter "github.com/isaacwallace123/portfolio-infra/internal/adapters/out/prometheus"
	"github.com/isaacwallace123/portfolio-infra/internal/service"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	metricsv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned"
)

func main() {
	apiKey := os.Getenv("INFRA_API_KEY")
	promURL := strings.TrimRight(os.Getenv("PROMETHEUS_URL"), "/")
	lokiURL := strings.TrimRight(os.Getenv("LOKI_URL"), "/")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("Failed to load in-cluster config: %v", err)
	}

	k8sClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	metricsClient, err := metricsv1beta1.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create metrics client: %v", err)
	}

	clusterRepo := k8sadapter.NewKubernetesRepository(k8sClient, metricsClient, lokiURL)
	metricsRepo := prometheusadapter.NewPrometheusRepository(promURL)
	infraSvc := service.NewInfraService(clusterRepo, metricsRepo)

	handler := httpadapter.NewHandler(infraSvc)
	router := httpadapter.NewRouter(handler, apiKey)
	server := httpadapter.NewServer(port, router)

	log.Printf("Infra agent listening on :%s", port)
	if err := server.Run(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
