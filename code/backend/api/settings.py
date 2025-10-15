"""
Django settings for api project.

Updated to use Neon PostgreSQL via .env (VITE_DATABASE_URL)
and secure CORS/CSRF setup for frontend (Vite).
"""

from pathlib import Path
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Base setup 
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR.parent.parent / ".env")

# Security 
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-va%oc6wg)=%ktza=j^k%2)hd=#af4+-xjjum1)u9^41_^q!fyk",
)
DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# Installed apps 
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "students",
    "activities",
]

# Middleware 
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# REST Framework 
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
}

# Templates 
ROOT_URLCONF = "api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "api.wsgi.application"

# Database (Neon PostgreSQL or fallback SQLite) 
database_url = os.getenv("VITE_DATABASE_URL")

if database_url:
    parsed = urlparse(database_url.replace("postgresql://", "postgres://"))
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/"),
            "USER": parsed.username,
            "PASSWORD": parsed.password,
            "HOST": parsed.hostname,
            "PORT": parsed.port or "5432",
            "OPTIONS": {"sslmode": "require"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation 
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization 
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files 
STATIC_URL = "static/"

# Primary key default 
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS & CSRF settings 
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]
CORS_ALLOW_HEADERS = [
    "content-type",
    "x-csrftoken",
    "authorization",
]

# Media files (user-uploaded content)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Optional: show DB info in logs (for debugging)
try:
    db_info = DATABASES["default"]
    print(
        f"[INFO] Using DB engine: {db_info.get('ENGINE')}, "
        f"host: {db_info.get('HOST', 'local')}, "
        f"name: {db_info.get('NAME')}"
    )
except Exception as e:
    print(f"[WARN] Could not print DB info: {e}")