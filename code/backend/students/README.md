Students app

Minimal app that adds a StudentProfile model and simple auth endpoints (login, logout, current user) using session authentication.

Setup
- Add 'students' to INSTALLED_APPS (already wired in api/settings.py).
- Run migrations: python manage.py makemigrations students && python manage.py migrate
- Create a superuser for admin/testing: python manage.py createsuperuser

Endpoints
- POST /api/auth/login/  -> {username, password} (uses session auth)
- POST /api/auth/logout/ -> logs out
- GET  /api/auth/user/   -> current user or 204
