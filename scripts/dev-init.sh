#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

echo "Working directory set to: $(pwd)"

echo "Setting environment variables for Postgres"
export DJANGO_DB=postgresql
export POSTGRE_USER=postgres
export POSTGRE_PASSWORD=postgres
export POSTGRE_NAME=postgres
export POSTGRE_HOST=localhost
export POSTGRE_PORT=5432

echo "Initializing instance with defaults..."
poetry run python label_studio/manage.py init_defaults

echo "Done."
