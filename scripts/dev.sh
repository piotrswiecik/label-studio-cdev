#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

export DJANGO_DB=${DJANGO_DB:-postgresql}
export POSTGRE_USER=${POSTGRE_USER:-postgres}
export POSTGRE_PASSWORD=${POSTGRE_PASSWORD:-postgres}
export POSTGRE_NAME=${POSTGRE_NAME:-postgres}
export POSTGRE_HOST=${POSTGRE_HOST:-localhost}
export POSTGRE_PORT=${POSTGRE_PORT:-5432}
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-core.settings.label_studio}
export DEBUG=${DEBUG:-true}
export LOG_LEVEL=${LOG_LEVEL:-DEBUG}
export LOG_DIR=${LOG_DIR:-tmp}

DJANGO_ADDR=${DJANGO_ADDR:-0.0.0.0:8080}

if [ ! -f .env ]; then
  cp .env.development .env
fi

docker compose -f docker-compose.dev.yml up -d

echo "Using DB: $DJANGO_DB host=$POSTGRE_HOST port=$POSTGRE_PORT name=$POSTGRE_NAME user=$POSTGRE_USER"
poetry run python label_studio/manage.py migrate

cd web
yarn run dev &
FRONTEND_PID=$!
cd ..

trap 'kill "$FRONTEND_PID" 2>/dev/null || true' EXIT INT TERM

poetry run python label_studio/manage.py runserver "$DJANGO_ADDR"
