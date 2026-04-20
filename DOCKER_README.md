# Docker setup for SculptingVisWebApp

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the Django app image on Ubuntu 24.04 |
| `requirements.txt` | Python dependencies |
| `docker-compose.yml` | Runs the app + MongoDB together |

---

## One required edit in `svis/settings.py`

The app hardcodes `localhost` for MongoDB in `library/views.py` and
`applets/views.py`. Inside Docker, MongoDB runs as a separate service called
`mongo`. Add this near the bottom of `svis/settings.py`:

```python
import os
MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')
```

Then replace every occurrence of:

```python
MongoClient('localhost', 27017)
```

with:

```python
from django.conf import settings as _s
MongoClient(_s.MONGO_HOST, 27017)
```

Or just do a project-wide find/replace:
  `MongoClient('localhost', 27017)`  →  `MongoClient(os.environ.get('MONGO_HOST', 'localhost'), 27017)`

The `docker-compose.yml` already sets `MONGO_HOST=mongo` for the web service.

---

## Also add WhiteNoise to MIDDLEWARE in `svis/settings.py`

WhiteNoise is included in requirements.txt so static files are served
without needing a separate nginx. Add it as the second middleware entry:

```python
MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # <-- add this
    ...
]
```

And add compression support (optional but recommended):

```python
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

---

## Quick start

```bash
# 1. Put Dockerfile, requirements.txt, docker-compose.yml in the project root
#    (same folder as manage.py)

# 2. Make the settings edits above

# 3. Build and run
docker compose up --build

# App available at http://localhost:8000
# MongoDB available at localhost:27017 (host-only, for Compass etc.)
```

## Rebuilding after code changes

```bash
docker compose up --build
```

## Running migrations manually inside the container

```bash
docker compose exec web python3 manage.py migrate
docker compose exec web python3 manage.py createsuperuser
```
