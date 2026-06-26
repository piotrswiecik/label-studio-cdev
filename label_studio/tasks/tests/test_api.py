from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from rest_framework.test import APITestCase
from tasks.models import Task, TaskVerification
from tasks.tests.factories import TaskFactory


class TestTaskAPI(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.organization = OrganizationFactory()
        cls.project = ProjectFactory(organization=cls.organization)
        cls.user = cls.organization.created_by

    def test_get_task(self):
        task = TaskFactory(project=self.project, data={'text': 'test'})

        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/tasks/{task.id}/')
        assert response.status_code == 200

        assert response.json() == {
            'id': task.id,
            'project': self.project.id,
            'created_at': task.created_at.isoformat().replace('+00:00', 'Z'),
            'updated_at': task.updated_at.isoformat().replace('+00:00', 'Z'),
            'annotations': [],
            'predictions': [],
            'drafts': [],
            'data': {'text': 'test'},
            'meta': {},
            'updated_by': [],
            'is_labeled': False,
            'overlap': 1,
            'file_upload': None,
            'annotations_ids': '',
            'annotations_results': '',
            'annotators': [],
            'completed_at': None,
            'predictions_model_versions': '',
            'draft_exists': False,
            'predictions_results': '',
            'predictions_score': None,
            'total_annotations': 0,
            'total_predictions': 0,
            'avg_lead_time': None,
            'cancelled_annotations': 0,
            'inner_id': task.inner_id,
            'storage_filename': None,
            'comment_authors': [],
            'comment_count': 0,
            'last_comment_updated_at': None,
            'unresolved_comment_count': 0,
            'allow_skip': True,
            'image_unreadable': False,
            'task_completed': False,
            'task_verified': False,
            'task_verified_by': None,
        }

    def test_patch_task(self):
        task = TaskFactory(project=self.project, data={'text': 'test'})

        payload = {
            'annotations': [],
            'predictions': [],
            'data': {'text': 'changed test'},
            'meta': {},
            'created_at': '',
            'updated_at': '',
            'updated_by': None,
            'is_labeled': False,
            'file_upload': None,
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/tasks/{task.id}/', data=payload, format='json')
        assert response.status_code == 200
        task.refresh_from_db()
        assert response.json() == {
            'id': task.id,
            'project': self.project.id,
            'created_at': task.created_at.isoformat().replace('+00:00', 'Z'),
            'updated_at': task.updated_at.isoformat().replace('+00:00', 'Z'),
            'annotations': [],
            'predictions': [],
            'data': {'text': 'changed test'},
            'meta': {},
            'updated_by': None,
            'is_labeled': False,
            'overlap': 1,
            'file_upload': None,
            'total_annotations': 0,
            'total_predictions': 0,
            'cancelled_annotations': 0,
            'inner_id': task.inner_id,
            'comment_authors': [],
            'comment_count': 0,
            'last_comment_updated_at': None,
            'unresolved_comment_count': 0,
            'allow_skip': True,
            'image_unreadable': False,
            'task_completed': False,
            'task_verified': False,
            'task_verified_by': None,
        }

    def test_patch_task_verified_records_event_and_attribution(self):
        task = TaskFactory(project=self.project, data={'text': 'test'})

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/tasks/{task.id}/', data={'task_verified': True}, format='json'
        )
        assert response.status_code == 200

        task.refresh_from_db()
        assert task.task_verified is True

        events = TaskVerification.objects.filter(task=task)
        assert events.count() == 1
        event = events.first()
        assert event.verified is True
        assert event.user == self.user

        verified_by = response.json()['task_verified_by']
        assert verified_by is not None
        assert verified_by['id'] == self.user.id
        assert verified_by['email'] == self.user.email
        assert verified_by['verified_at'] is not None

    def test_patch_task_unverified_clears_attribution_but_keeps_log(self):
        task = TaskFactory(project=self.project, data={'text': 'test'})

        self.client.force_authenticate(user=self.user)
        self.client.patch(f'/api/tasks/{task.id}/', data={'task_verified': True}, format='json')
        self.client.patch(f'/api/tasks/{task.id}/', data={'task_verified': False}, format='json')

        task.refresh_from_db()
        assert task.task_verified is False

        # full audit log keeps both events
        events = list(TaskVerification.objects.filter(task=task).order_by('created_at'))
        assert [e.verified for e in events] == [True, False]

        # but the displayed attribution is gone while unverified
        response = self.client.get(f'/api/tasks/{task.id}/')
        assert response.json()['task_verified_by'] is None

    def test_patch_task_verified_unchanged_records_no_event(self):
        task = TaskFactory(project=self.project, data={'text': 'test'})

        self.client.force_authenticate(user=self.user)
        # patching an unrelated field should not create a verification event
        self.client.patch(f'/api/tasks/{task.id}/', data={'task_verified': False}, format='json')

        assert TaskVerification.objects.filter(task=task).count() == 0

    def test_create_task_without_project_id_fails(self):
        """Test that creating a task without project ID fails with appropriate error message"""
        payload = {
            'data': {'text': 'test task'},
            'meta': {},
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/tasks/', data=payload, format='json')

        assert response.status_code == 400
        response_data = response.json()
        assert response_data['validation_errors']['project'] == ['This field is required.']

    def test_create_task_with_project_id_succeeds(self):
        """Test that creating a task with valid project ID succeeds"""
        payload = {
            'project': self.project.id,
            'data': {'text': 'test task'},
            'meta': {},
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/tasks/', data=payload, format='json')

        assert response.status_code == 201
        response_data = response.json()
        assert response_data['project'] == self.project.id
        assert response_data['data'] == {'text': 'test task'}

    def test_get_task_includes_allow_skip(self):
        """Test that GET task API includes allow_skip field"""
        task = TaskFactory(project=self.project, allow_skip=False)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/tasks/{task.id}/')
        assert response.status_code == 200
        response_data = response.json()
        assert 'allow_skip' in response_data
        assert response_data['allow_skip'] is False

    def test_create_task_with_allow_skip(self):
        """Test that creating a task with allow_skip field succeeds"""
        payload = {
            'project': self.project.id,
            'data': {'text': 'test task'},
            'meta': {},
            'allow_skip': False,
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/tasks/', data=payload, format='json')

        assert response.status_code == 201
        response_data = response.json()
        assert response_data['allow_skip'] is False
        task = Task.objects.get(id=response_data['id'])
        assert task.allow_skip is False

    def test_skip_unskippable_task_fails(self):
        """Test that skipping a task with allow_skip=False fails"""
        task = TaskFactory(project=self.project, allow_skip=False)

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/tasks/{task.id}/annotations/', data={'result': [], 'was_cancelled': True}, format='json'
        )

        assert response.status_code == 400
        response_data = response.json()
        assert 'cannot be skipped' in str(response_data).lower()

    def test_skip_skippable_task_succeeds(self):
        """Test that skipping a task with allow_skip=True succeeds"""
        task = TaskFactory(project=self.project, allow_skip=True)

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/tasks/{task.id}/annotations/', data={'result': [], 'was_cancelled': True}, format='json'
        )

        assert response.status_code == 201

    def test_skip_task_with_default_allow_skip_succeeds(self):
        """Test that skipping a task without explicit allow_skip (defaults to True) succeeds"""
        task = TaskFactory(project=self.project)  # allow_skip defaults to True

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/tasks/{task.id}/annotations/', data={'result': [], 'was_cancelled': True}, format='json'
        )

        assert response.status_code == 201
