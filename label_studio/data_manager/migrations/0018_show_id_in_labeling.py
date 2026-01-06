"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.db import migrations


def show_id_column(apps, schema_editor):
    View = apps.get_model('data_manager', 'View')
    views = View.objects.all()

    for view in views:
        if 'hiddenColumns' in view.data:
            if 'labeling' in view.data['hiddenColumns']:
                # Remove 'tasks:id' from hidden columns to make it visible
                if 'tasks:id' in view.data['hiddenColumns']['labeling']:
                    view.data['hiddenColumns']['labeling'].remove('tasks:id')
                view.data['hiddenColumns']['labeling'] = list(set(view.data['hiddenColumns']['labeling']))

        view.save()


def hide_id_column(apps, schema_editor):
    View = apps.get_model('data_manager', 'View')
    views = View.objects.all()

    for view in views:
        if 'hiddenColumns' in view.data:
            if 'labeling' in view.data['hiddenColumns']:
                # Add 'tasks:id' back to hidden columns
                view.data['hiddenColumns']['labeling'].append('tasks:id')
                view.data['hiddenColumns']['labeling'] = list(set(view.data['hiddenColumns']['labeling']))

        view.save()


class Migration(migrations.Migration):
    dependencies = [
        ('data_manager', '0017_update_agreement_selected_to_nested_structure'),
    ]

    operations = [
        migrations.RunPython(show_id_column, hide_id_column),
    ]
