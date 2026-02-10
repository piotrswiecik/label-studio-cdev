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

if [ -n "$1" ]; then
    echo "Extracting data for project $1..."
    python label_studio/manage.py extract_data --project_id "$1"
else
    echo "Extracting data for all projects..."
    python label_studio/manage.py extract_data
fi

echo "Done."