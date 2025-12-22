import getpass

from django.contrib.auth import get_user_model
from django.core.management import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Reset a user password by username/email.'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_model = get_user_model()
        self.username_field = self.user_model.USERNAME_FIELD

    def add_arguments(self, parser):
        parser.add_argument('--username', dest='username')
        parser.add_argument('--password', dest='password')

    def handle(self, *args, **options):
        username = options.get('username')
        if not username:
            username = input(f'{self.username_field}: ')

        if not username:
            raise CommandError(f'{self.username_field} is required')

        user = self.user_model.objects.filter(**{self.username_field: username}).first()
        if user is None:
            raise CommandError(f'User with {self.username_field} "{username}" not found')

        password = options.get('password')
        if not password:
            password = getpass.getpass(f'New password for {username}: ')

        if not password:
            raise CommandError('Password cannot be empty')

        user.set_password(password)
        user.save(update_fields=['password'])

        self.stdout.write(self.style.SUCCESS(f'Password updated for {username}.'))
