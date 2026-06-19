"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import json

import pytest
from projects.models import Project
from tasks.models import Annotation, Task


@pytest.fixture
def configured_project_with_annotation(configured_project):
    """A configured project that already has one annotation on its first task."""
    task = Task.objects.filter(project=configured_project).first()
    Annotation.objects.create(task=task, project=configured_project, result=[])
    return configured_project


def _set_read_only(project, value):
    Project.objects.filter(id=project.id).update(is_read_only=value)


@pytest.mark.django_db
def test_create_annotation_blocked_when_read_only(business_client, configured_project):
    _set_read_only(configured_project, True)
    task = Task.objects.filter(project=configured_project).first()

    r = business_client.post(
        f'/api/tasks/{task.id}/annotations/',
        data={'result': json.dumps([]), 'task': task.id},
    )

    assert r.status_code == 403
    assert Annotation.objects.filter(task=task).count() == 0


@pytest.mark.django_db
def test_create_annotation_allowed_when_not_read_only(business_client, configured_project):
    _set_read_only(configured_project, False)
    task = Task.objects.filter(project=configured_project).first()

    r = business_client.post(
        f'/api/tasks/{task.id}/annotations/',
        data={'result': json.dumps([]), 'task': task.id},
    )

    assert r.status_code == 201
    assert Annotation.objects.filter(task=task).count() == 1


@pytest.mark.django_db
def test_update_annotation_blocked_when_read_only(business_client, configured_project_with_annotation):
    project = configured_project_with_annotation
    annotation = Annotation.objects.filter(project=project).first()
    _set_read_only(project, True)

    r = business_client.patch(
        f'/api/annotations/{annotation.id}/',
        data=json.dumps({'result': [{'foo': 'bar'}]}),
        content_type='application/json',
    )

    assert r.status_code == 403


@pytest.mark.django_db
def test_delete_annotation_blocked_when_read_only(business_client, configured_project_with_annotation):
    project = configured_project_with_annotation
    annotation = Annotation.objects.filter(project=project).first()
    _set_read_only(project, True)

    r = business_client.delete(f'/api/annotations/{annotation.id}/')

    assert r.status_code == 403
    assert Annotation.objects.filter(id=annotation.id).exists()


@pytest.mark.django_db
def test_list_annotations_allowed_when_read_only(business_client, configured_project_with_annotation):
    """Viewing annotations must keep working on a read-only project."""
    project = configured_project_with_annotation
    task = Task.objects.filter(project=project).first()
    _set_read_only(project, True)

    r = business_client.get(f'/api/tasks/{task.id}/annotations/')

    assert r.status_code == 200
    assert len(r.json()) == 1


@pytest.mark.django_db
def test_set_read_only_endpoint_requires_admin(business_client, configured_project):
    # business owner is not staff/superuser
    business_client.user.is_staff = False
    business_client.user.is_superuser = False
    business_client.user.save()

    r = business_client.post(f'/api/projects/{configured_project.id}/read-only/')

    assert r.status_code == 403
    configured_project.refresh_from_db()
    assert configured_project.is_read_only is False


@pytest.mark.django_db
def test_set_and_unset_read_only_endpoint_as_admin(business_client, configured_project):
    business_client.user.is_staff = True
    business_client.user.save()

    r = business_client.post(f'/api/projects/{configured_project.id}/read-only/')
    assert r.status_code == 200
    configured_project.refresh_from_db()
    assert configured_project.is_read_only is True

    r = business_client.post(f'/api/projects/{configured_project.id}/editable/')
    assert r.status_code == 200
    configured_project.refresh_from_db()
    assert configured_project.is_read_only is False


@pytest.mark.django_db
def test_is_read_only_not_writable_via_project_patch(business_client, configured_project):
    """The flag must only change through the dedicated admin endpoints, not generic PATCH."""
    business_client.user.is_staff = True
    business_client.user.save()

    r = business_client.patch(
        f'/api/projects/{configured_project.id}/',
        data=json.dumps({'is_read_only': True}),
        content_type='application/json',
    )

    assert r.status_code == 200
    configured_project.refresh_from_db()
    assert configured_project.is_read_only is False
