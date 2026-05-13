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

ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}

poetry run python label_studio/manage.py shell -c "
from django.contrib.auth import get_user_model
from django.conf import settings
from core.utils.common import load_func
from organizations.models import Organization

User = get_user_model()
user, created = User.objects.get_or_create(
    email='$ADMIN_EMAIL',
    defaults={'is_staff': True, 'is_superuser': True},
)
user.is_staff = True
user.is_superuser = True
user.set_password('$ADMIN_PASSWORD')

org = Organization.objects.first()
if org is None:
    org = load_func(settings.CREATE_ORGANIZATION)(title=settings.DEFAULT_ORGANIZATION_NAME, created_by=user)
else:
    org.add_user(user)

user.active_organization = org
user.save()

print(f'Dev admin ready: {user.email} / $ADMIN_PASSWORD')
"
