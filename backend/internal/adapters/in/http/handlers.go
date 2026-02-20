package httpadapter

import (
	"context"
	"net/http"
	"strings"
	"time"

	portin "github.com/isaacwallace123/portfolio-infra/internal/core/ports/in"
)

type Handler struct {
	service portin.InfraService
}

func NewHandler(svc portin.InfraService) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.Health(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "healthy"})
}

func (h *Handler) Containers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	containers, err := h.service.ListContainers(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, containers)
}

func (h *Handler) ContainerStats(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/containers/", "/stats")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "container ID required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	stats, err := h.service.GetContainerStats(ctx, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) ContainerLogs(w http.ResponseWriter, r *http.Request) {
	id := extractPathParam(r.URL.Path, "/containers/", "/logs")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "container ID required"})
		return
	}

	tail := r.URL.Query().Get("tail")
	if tail == "" {
		tail = "50"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	logs, err := h.service.GetContainerLogs(ctx, id, tail)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, logs)
}

func (h *Handler) Networks(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	networks, err := h.service.ListNetworks(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, networks)
}

func (h *Handler) System(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	info, err := h.service.GetSystemInfo(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, info)
}

func (h *Handler) MetricsNode(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	metrics, err := h.service.GetNodeMetrics(ctx)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, metrics)
}

func extractPathParam(path, prefix, suffix string) string {
	start := strings.Index(path, prefix)
	if start == -1 {
		return ""
	}
	rest := path[start+len(prefix):]
	end := strings.Index(rest, suffix)
	if end == -1 {
		return rest
	}
	return rest[:end]
}
