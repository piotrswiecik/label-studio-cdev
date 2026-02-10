import json
import logging
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Extract predictions and annotations for tasks in a project to JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--project_id',
            type=int,
            default=None,
            help='Project ID to extract. If omitted, all projects are extracted.',
        )

    @staticmethod
    def _parse_json(value):
        """Deserialize a value that may be a JSON string into a Python object."""
        if isinstance(value, str):
            return json.loads(value)
        return value

    def _extract_project(self, cursor, project_id, dump_dir):
        cursor.execute(
            'SELECT id, data FROM task WHERE project_id = %s ORDER BY id',
            [project_id],
        )
        tasks = cursor.fetchall()

        if not tasks:
            self.stdout.write(self.style.WARNING(
                f'Project {project_id}: no tasks found, skipping'
            ))
            return

        result = []
        for task_id, task_data in tasks:
            cursor.execute(
                'SELECT result FROM prediction WHERE task_id = %s',
                [task_id],
            )
            predictions = [self._parse_json(row[0]) for row in cursor.fetchall()]

            cursor.execute(
                'SELECT result FROM task_completion WHERE task_id = %s',
                [task_id],
            )
            annotations = [self._parse_json(row[0]) for row in cursor.fetchall()]

            result.append({
                'task_id': task_id,
                'data': self._parse_json(task_data),
                'predictions': predictions,
                'annotations': annotations,
            })

        output_file = os.path.join(dump_dir, f'project_{project_id}.json')
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f'Project {project_id}: extracted {len(tasks)} tasks to {output_file}'
        ))

    def handle(self, *args, **options):
        project_root = os.path.dirname(os.path.dirname(settings.BASE_DIR))
        dump_dir = os.path.join(project_root, 'dump')
        os.makedirs(dump_dir, exist_ok=True)

        project_id = options['project_id']

        with connection.cursor() as cursor:
            if project_id is not None:
                cursor.execute('SELECT id FROM project WHERE id = %s', [project_id])
                if not cursor.fetchone():
                    self.stderr.write(self.style.ERROR(
                        f'Project {project_id} not found'
                    ))
                    return
                self._extract_project(cursor, project_id, dump_dir)
            else:
                cursor.execute('SELECT id FROM project ORDER BY id')
                project_ids = [row[0] for row in cursor.fetchall()]
                if not project_ids:
                    self.stdout.write(self.style.WARNING('No projects found'))
                    return
                for pid in project_ids:
                    self._extract_project(cursor, pid, dump_dir)

        self.stdout.write(self.style.SUCCESS(f'Done. Output directory: {dump_dir}'))