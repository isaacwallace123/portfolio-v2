package overwatch

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/isaacwallace123/portfolio-infra/internal/core/domain"
	portout "github.com/isaacwallace123/portfolio-infra/internal/core/ports/out"
)

type overwatchRepository struct {
	baseURL string
	client  *http.Client
}

func NewOverwatchRepository(baseURL string) portout.OverwatchRepository {
	return &overwatchRepository{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

func (r *overwatchRepository) get(ctx context.Context, path string, out interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, r.baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("overwatch: build request: %w", err)
	}
	resp, err := r.client.Do(req)
	if err != nil {
		return fmt.Errorf("overwatch: request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("overwatch: unexpected status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("overwatch: decode response: %w", err)
	}
	return nil
}

func (r *overwatchRepository) GetInsights(ctx context.Context) (*domain.OverwatchInsight, error) {
	var insight domain.OverwatchInsight
	if err := r.get(ctx, "/insights", &insight); err != nil {
		return nil, err
	}
	return &insight, nil
}

func (r *overwatchRepository) GetPodInsights(ctx context.Context, namespace, app string) (*domain.PodInsight, error) {
	var insight domain.PodInsight
	path := fmt.Sprintf("/pod-insights?namespace=%s&app=%s", namespace, app)
	if err := r.get(ctx, path, &insight); err != nil {
		return nil, err
	}
	return &insight, nil
}

func (r *overwatchRepository) GetAllPodInsights(ctx context.Context) ([]domain.PodInsight, error) {
	var insights []domain.PodInsight
	if err := r.get(ctx, "/pod-insights/all", &insights); err != nil {
		return nil, err
	}
	return insights, nil
}

func (r *overwatchRepository) GetHistory(ctx context.Context) ([]domain.OverwatchInsight, error) {
	var history []domain.OverwatchInsight
	if err := r.get(ctx, "/history?limit=48", &history); err != nil {
		return nil, err
	}
	return history, nil
}
