.PHONY: up down logs ps clean db-shell es-health nats-health health

# Auto-detect container runtime (Docker or Podman)
ifeq ($(shell command -v docker 2>/dev/null),)
    ifeq ($(shell command -v podman 2>/dev/null),)
        $(error "❌ Neither docker nor podman found. Please install one of them.")
    else
        CONTAINER_RUNTIME := podman
        COMPOSE := podman-compose
    endif
else
    CONTAINER_RUNTIME := docker
    COMPOSE := docker compose
endif

runtime:
	@echo "Using: $(CONTAINER_RUNTIME) with $(COMPOSE)"
up:
	$(COMPOSE) up -d
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	npm run migration:run
down:
	$(COMPOSE) down
logs:
	$(COMPOSE) logs -f
log-svc:
	$(COMPOSE) logs -f $(SVC)
ps:
	$(COMPOSE) ps
clean:
	$(COMPOSE) down -v
restart: down up

# DB
db-shell:
	docker compose exec postgres psql -U thmanyah
db-migrate:
	npm run migration:run

# Health
pg-health:
	@$(COMPOSE) exec postgres pg_isready -U thmanyah && echo "✅ PostgreSQL is healthy"

es-health:
	@curl -s http://localhost:9200/_cluster/health | jq . || echo "❌ Elasticsearch not ready"

nats-health:
	@curl -s http://localhost:8222/healthz && echo "✅ NATS is healthy" || echo "❌ NATS not ready"

health: pg-health es-health nats-health

# Dev
install:
	npm install
dev:
	npm run start:dev
test:
	npm run test
test-e2e:
	npm run test:e2e
build:
	npm run build
lint:
	npm run lint

## First-time setup: install deps + start infrastructure + run migrations
setup: install up
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 10
	@make health
	@npm run migration:run
	@echo "✅ Development environment ready!"
