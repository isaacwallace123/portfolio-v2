package httpadapter

import (
	"net/http"
	"strings"
)

func NewRouter(h *Handler, apiKey string) http.Handler {
	mux := http.NewServeMux()

	protected := func(hf http.HandlerFunc) http.HandlerFunc {
		return contentTypeMiddleware(apiKeyMiddleware(apiKey, hf))
	}

	mux.HandleFunc("/health", contentTypeMiddleware(h.Health))
	mux.HandleFunc("/containers", protected(h.Containers))
	mux.HandleFunc("/containers/", protected(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/stats"):
			h.ContainerStats(w, r)
		case strings.HasSuffix(path, "/logs"):
			h.ContainerLogs(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	mux.HandleFunc("/networks", protected(h.Networks))
	mux.HandleFunc("/system", protected(h.System))
	mux.HandleFunc("/metrics/node", protected(h.MetricsNode))

	return mux
}
