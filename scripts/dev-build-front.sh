#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

echo "Working directory set to: $(pwd)"

echo "Setting environment variables for Postgres"
export DJANGO_DB=${DJANGO_DB:-postgresql}
export POSTGRE_USER=${POSTGRE_USER:-postgres}
export POSTGRE_PASSWORD=${POSTGRE_PASSWORD:-postgres}
export POSTGRE_NAME=${POSTGRE_NAME:-postgres}
export POSTGRE_HOST=${POSTGRE_HOST:-localhost}
export POSTGRE_PORT=${POSTGRE_PORT:-5432}

echo "Using DB: $DJANGO_DB host=$POSTGRE_HOST port=$POSTGRE_PORT name=$POSTGRE_NAME user=$POSTGRE_USER"

echo "Rebuilding client app..."
cd web && yarn build

cd .. && python label_studio/manage.py collectstatic --noinput

echo "Done."