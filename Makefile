.PHONY: help dev prod down logs clean restart migrate-create migrate-up migrate-down db-reset prisma-studio

# Default target
help:
	@echo "Portfolio Monorepo Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development environment with hot reload"
	@echo "  make logs             - View logs from all services"
	@echo "  make logs-frontend    - View frontend logs only"
	@echo "  make down             - Stop all services"
	@echo "  make restart          - Restart all services"
	@echo "  make clean            - Remove all containers, volumes, and images"
	@echo ""
	@echo "Production:"
	@echo "  make prod             - Start production environment"
	@echo "  make prod-build       - Build production images"
	@echo ""
	@echo "Database:"
	@echo "  make migrate-up       - Run database migrations"
	@echo "  make migrate-create   - Create new migration (name=migration_name)"
	@echo "  make db-reset         - Reset database (WARNING: deletes all data)"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo "  make prisma-studio    - Open Prisma Studio"
	@echo ""
	@echo "Utilities:"
	@echo "  make create-admin     - Create admin user"
	@echo "  make shell-frontend   - Access frontend container shell"
	@echo "  make test             - Run tests"

# Development
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✓ Development environment started"
	@echo "Frontend: http://localhost:3000"
	@echo "Adminer: http://localhost:8080"
	@echo "Prisma Studio: http://localhost:5555"

# Production
prod:
	docker-compose up -d
	@echo "✓ Production environment started"

prod-build:
	docker-compose build --no-cache
	@echo "✓ Production images built"

# Container Management
down:
	docker-compose down
	@echo "✓ All services stopped"

logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

restart:
	docker-compose restart
	@echo "✓ All services restarted"

clean:
	docker-compose down -v --rmi all --remove-orphans
	@echo "✓ All containers, volumes, and images removed"

# Database Management
migrate-up:
	docker-compose exec frontend npx prisma migrate deploy
	@echo "✓ Migrations applied"

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: Please provide migration name. Usage: make migrate-create name=your_migration_name"; \
		exit 1; \
	fi
	cd frontend && npx prisma migrate dev --name $(name)
	@echo "✓ Migration created: $(name)"

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec frontend npx prisma migrate reset --force; \
		echo "✓ Database reset complete"; \
	else \
		echo "Cancelled"; \
	fi

db-shell:
	docker-compose exec postgres psql -U portfolio -d portfolio

prisma-studio:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d prisma-studio
	@echo "✓ Prisma Studio started at http://localhost:5555"

# Utilities
create-admin:
	docker-compose exec frontend node scripts/create-admin.js

shell-frontend:
	docker-compose exec frontend sh

shell-postgres:
	docker-compose exec postgres sh

# Testing
test:
	docker-compose exec frontend npm test

test-e2e:
	docker-compose exec frontend npm run test:e2e

# Setup
setup:
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file from .env.example"; \
		echo "⚠️  Please update .env with your actual values"; \
	else \
		echo "✓ .env file already exists"; \
	fi
	@echo "Run 'make dev' to start the development environment"

# Install dependencies locally (for IDE support)
install:
	cd frontend && npm install
	@echo "✓ Frontend dependencies installed"

# Format code
format:
	cd frontend && npm run format
	@echo "✓ Code formatted"

# Lint code
lint:
	cd frontend && npm run lint
	@echo "✓ Code linted"

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✓ Frontend: healthy" || echo "✗ Frontend: unhealthy"
	@docker-compose exec postgres pg_isready -U portfolio > /dev/null 2>&1 && echo "✓ Database: healthy" || echo "✗ Database: unhealthy"
	@docker-compose exec redis redis-cli ping > /dev/null 2>&1 && echo "✓ Redis: healthy" || echo "✗ Redis: unhealthy"