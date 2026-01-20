import csv
import json
import logging
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Dump task id and image link for each project to CSV files'

    def handle(self, *args, **options):
        # Create dump directory in project root (two levels up from BASE_DIR which is label_studio/core/)
        project_root = os.path.dirname(os.path.dirname(settings.BASE_DIR))
        dump_dir = os.path.join(project_root, 'dump')
        os.makedirs(dump_dir, exist_ok=True)

        with connection.cursor() as cursor:
            # Get all projects
            cursor.execute('SELECT id, title FROM project')
            projects = cursor.fetchall()

            for project_id, project_title in projects:
                # Get all tasks for this project
                cursor.execute(
                    'SELECT id, data FROM task WHERE project_id = %s',
                    [project_id]
                )
                tasks = cursor.fetchall()

                output_file = os.path.join(dump_dir, f'project_{project_id}.csv')
                with open(output_file, 'w', newline='') as f:
                    writer = csv.writer(f, delimiter=';')
                    for task_id, data in tasks:
                        # Parse JSON data and extract image field
                        if isinstance(data, str):
                            data = json.loads(data)
                        image = data.get('image', '') if data else ''
                        writer.writerow([task_id, image])

                logger.info(f'Dumped {len(tasks)} tasks for project {project_id} ({project_title}) to {output_file}')
                self.stdout.write(
                    self.style.SUCCESS(f'Dumped {len(tasks)} tasks for project {project_id} to {output_file}')
                )

        self.stdout.write(self.style.SUCCESS(f'All projects dumped to {dump_dir}'))