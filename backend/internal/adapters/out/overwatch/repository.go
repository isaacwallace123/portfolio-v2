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

func (r *overwatchRepository) GetInsights(ctx context.Context) (*domain.OverwatchInsight, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, r.baseURL+"/insights", nil)
	if err != nil {
		return nil, fmt.Errorf("overwatch: build request: %w", err)
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("overwatch: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("overwatch: unexpected status %d", resp.StatusCode)
	}

	var insight domain.OverwatchInsight
	if err := json.NewDecoder(resp.Body).Decode(&insight); err != nil {
		return nil, fmt.Errorf("overwatch: decode response: %w", err)
	}

	return &insight, nil
}
