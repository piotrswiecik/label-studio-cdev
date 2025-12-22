import re
from django.contrib.auth import get_user_model
from django.core.management import BaseCommand, CommandError
from django.conf import settings

from core.utils.common import load_func
from organizations.models import Organization

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


class Command(BaseCommand):
    help = 'Initializes fresh Label Studio instance with default settings.'
    default_username = 'admin'
    default_password = 'admin'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_model = get_user_model()
        self.username_field = self.user_model.USERNAME_FIELD  # noqa

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        if self._check_su_exists():
            raise CommandError('Superuser already exists')

        username = None
        user_data = dict()

        org_fn = load_func(settings.CREATE_ORGANIZATION)

        while username is None:
            username = input(f'Enter administrator {self.username_field}: ')
            if username:
                error = self._validate_username(username)
                if error:
                    raise CommandError(error)

        user_data[self.username_field] = username

        for f in self.user_model.REQUIRED_FIELDS:
            v = input(f'Enter {f}: ')
            if not v:
                raise CommandError(f'{f} can\'t be empty')
            user_data[f] = v

        user_data["password"] = self._generate_password()

        user_data["is_staff"] = True
        user_data["is_superuser"] = True

        user = self.user_model.objects.create_user(**user_data) # noqa
        self.stdout.write(self.style.SUCCESS(f'Administrator {username} created successfully.'))

        org = Organization.objects.first()
        if not org:
            org = org_fn(title='Label Studio', created_by=user)
            self.stdout.write(self.style.SUCCESS('Staff organization created successfully.'))
        else:
            org.add_user(user)

        user.active_organization = org
        user.save(update_fields=['active_organization'])


    def _validate_username(self, username):
        if username.strip() == '':
            return 'username can\'t be empty'

        if self.user_model.objects.filter(**{self.username_field: username}).exists():
            return 'username is already taken'

        if self.username_field == 'email':
            if not re.match(EMAIL_REGEX, username):
                return 'invalid email'

        return None

    def _generate_password(self):
        return self.default_password

    def _check_su_exists(self):
        return self.user_model.objects.filter(is_superuser=True).exists()
