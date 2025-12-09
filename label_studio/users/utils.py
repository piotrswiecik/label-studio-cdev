from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.html import strip_tags
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def create_signup_link(request):
    """Create activation token and signup link from signup request"""
    from users.models import SignUpActivationToken # avoid circular import
    token = SignUpActivationToken.objects.create(user=request.user)
    protocol = 'https' if request.is_secure() else 'http'
    current_site = get_current_site(request)
    relative_url = reverse('user-admin-activate', kwargs={"token": token.token})
    return f"{protocol}://{current_site.domain}{relative_url}"


def send_admin_signup_notification(request):
    """Send email with approval notification to admin on user signup"""
    html_content = render_to_string(
        "users/admin/signup_notification_email_admin.html",
        {
            "user_email": request.user.email,
            "activation_link": create_signup_link(request)
        }
    )

    fallback_text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        'New user registration for Coronary.AI Studio',
        fallback_text_content,
        settings.FROM_EMAIL,
        settings.USER_SIGNUP_ADMIN_EMAILS
    )

    email.attach_alternative(html_content, "text/html")
    email.send()


def send_user_signup_notification(request):
    """Send email to user with pending approval info"""
    html_content = render_to_string(
        "users/admin/signup_notification_email_user.html",
        {}
    )

    fallback_text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        'Status aktywacji konta w Coronary.AI Studio',
        fallback_text_content,
        settings.FROM_EMAIL,
        [request.user.email]
    )

    email.attach_alternative(html_content, "text/html")

    try:
        email.send()
    except Exception as e:
        # TODO: add retry / rollback
        pass


