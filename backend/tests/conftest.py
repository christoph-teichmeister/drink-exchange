import os
import shutil
from pathlib import Path

import pytest
from django.conf import settings
from django.core.management import call_command
from django.utils.translation.reloader import translation_file_changed


@pytest.fixture(scope="session")
def compiled_messages() -> None:
    """Compile the German catalog so translation tests see the current `.po` file.

    `.mo` files are build output and not committed. Without GNU gettext the tests that need the catalog are skipped
    locally; CI installs gettext, so there a missing `msgfmt` is an error instead of a skip.
    """

    if shutil.which("msgfmt") is None:
        message = "GNU gettext (msgfmt) is not installed; install it to run the translation tests."
        if os.environ.get("CI"):
            pytest.fail(message)
        pytest.skip(message)
    locale_dir = Path(settings.LOCALE_PATHS[0])
    call_command("compilemessages", locale=["de"], ignore_patterns=[".venv", "staticfiles"], verbosity=0)
    # Drop catalogs Django may have cached before the `.mo` file existed.
    translation_file_changed(sender=None, file_path=locale_dir / "de" / "LC_MESSAGES" / "django.mo")
