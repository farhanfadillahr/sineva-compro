# Local development shortcuts. Every target wraps an npm script or a Docker Compose command that is
# documented in the README and docs/runbooks; nothing here deploys or touches a remote target.
# Works with the GNU Make 3.81 that ships with macOS. Run `make` or `make help` for the list.

# Node version from .nvmrc. When nvm has it installed, it is put first on PATH so `make` works from
# a shell that defaults to another Node (the engines field requires Node 24).
NODE_VERSION := $(shell cat .nvmrc 2>/dev/null)
NVM_NODE_BIN := $(HOME)/.nvm/versions/node/v$(NODE_VERSION)/bin
ifneq ($(wildcard $(NVM_NODE_BIN)/node),)
export PATH := $(NVM_NODE_BIN):$(PATH)
endif

COMPOSE := docker compose
STORAGE_COMPOSE := docker compose --env-file .storage/compose.env -f compose.storage.yaml
DATABASE := sineva_compro_app

.DEFAULT_GOAL := help
.PHONY: help node install env setup up down db-up db-down db-test-up storage-up storage-down \
	storage-setup storage-env storage-check migrate seed seed-demo admin dev build start format check lint \
	typecheck test test-db test-all status

help: ## Show this list
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# --- First run ---------------------------------------------------------------------------------

node: ## Check that Node 24 from .nvmrc is the one in use
	@node -v | grep -q '^v24\.' || { echo "Node 24 is required (found $$(node -v)). Run: nvm install $(NODE_VERSION)"; exit 1; }
	@echo "Node $$(node -v)"

install: node ## Install dependencies from the lockfile (npm ci)
	npm ci

env: node ## Create .env with random local credentials (an existing .env is kept)
	@if [ -f .env ]; then echo ".env already exists; kept as it is"; else npm run setup:env; fi

setup: install env up migrate seed ## First run: install, .env, Postgres + SeaweedFS, migrate, seed
	@echo "Next: make admin (create the first Admin account), then make dev"

# --- Services ----------------------------------------------------------------------------------

up: db-up storage-up ## Start Postgres and SeaweedFS

down: storage-down db-down ## Stop Postgres and SeaweedFS (data is kept)

db-up: ## Start the development Postgres
	$(COMPOSE) up -d --wait --wait-timeout 90 postgres

db-down: ## Stop the Postgres containers (volume is kept)
	$(COMPOSE) --profile test stop postgres postgres-test

db-test-up: ## Start the throwaway test Postgres (port 5433, data in memory)
	$(COMPOSE) --profile test up -d --wait --wait-timeout 90 postgres-test

storage-setup: node ## Create local SeaweedFS credentials (kept when they already exist)
	npm run storage:setup

storage-up: storage-setup ## Start SeaweedFS, create the media buckets and link the app keys
	$(STORAGE_COMPOSE) up -d --wait
	npm run storage:bootstrap
	@$(MAKE) --no-print-directory storage-env

# Fills MEDIA_S3_* in .env with the scoped `app` identity, only where the value is still empty, and
# never prints a value.
storage-env: node
	@node -e "const fs=require('fs');const k=require('./.storage/secrets/app.json');let s=fs.readFileSync('.env','utf8');const set=(n,v)=>{s=s.replace(new RegExp('^'+n+'=$$','m'),n+'='+v)};set('MEDIA_S3_ACCESS_KEY_ID',k.accessKeyId);set('MEDIA_S3_SECRET_ACCESS_KEY',k.secretAccessKey);fs.writeFileSync('.env',s,{mode:0o600});console.log('Media storage keys in .env are set (values not printed).')"

storage-down: ## Stop SeaweedFS (volumes are kept; never add -v)
	@if [ -f .storage/compose.env ]; then $(STORAGE_COMPOSE) down; fi

storage-check: node ## Health check of the SeaweedFS buckets and gateway
	npm run storage:check

# --- Database ----------------------------------------------------------------------------------

migrate: node ## Apply database migrations
	npm run db:migrate

seed: node ## Insert launch content (English and Indonesian) where it is missing
	npm run db:seed

seed-demo: node ## Add clearly marked demo rows (local database only)
	npm run db:seed -- --demo

admin: node ## Create the first Admin account (asks for name, email and password)
	npm run bootstrap:admin -- --confirm-database=$(DATABASE)

# --- App ---------------------------------------------------------------------------------------

dev: node ## Start the dev server on http://127.0.0.1:3000
	npm run dev

build: node ## Production build
	npm run build

start: node ## Serve the production build
	npm run start

# --- Quality -----------------------------------------------------------------------------------

format: node ## Format every file with Prettier
	npm run format

lint: node ## ESLint with zero warnings
	npm run lint

typecheck: node ## TypeScript check
	npm run typecheck

test: node ## Unit tests (node + jsdom)
	npm test

test-db: node db-test-up ## Database tests against the test Postgres (migrates it first)
	npm run test:prepare
	npm run test:database

check: node ## Everything CI checks before a push: format, lint, typecheck, unit tests
	npm run format:check
	npm run lint
	npm run typecheck
	npm test

test-all: check test-db ## check plus the database tests

status: ## Show the running containers of this project
	@$(COMPOSE) ps
	@if [ -f .storage/compose.env ]; then $(STORAGE_COMPOSE) ps; fi
