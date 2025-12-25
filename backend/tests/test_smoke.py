import pytest

from django.core.management import call_command


@pytest.mark.django_db(transaction=True)
def test_smoke_migrations_apply():
    call_command("migrate", verbosity=0, interactive=False)
