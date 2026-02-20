package httpadapter

import (
	"fmt"
	"net/http"
)

type Server struct {
	port   string
	router http.Handler
}

func NewServer(port string, router http.Handler) *Server {
	return &Server{
		port:   port,
		router: router,
	}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.port)
	return http.ListenAndServe(addr, s.router)
}
