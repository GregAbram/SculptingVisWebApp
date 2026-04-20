# SculptingVisWebApp — Django + MongoDB
# Ubuntu 24.04 LTS
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ── System packages ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-venv \
        # Pillow native deps
        libjpeg-turbo8-dev \
        libpng-dev \
        # NumPy / general math
        libopenblas-dev \
        # MongoDB client libs (pymongo talks to an external mongod)
        libssl-dev \
        # Runtime utilities
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── Python deps ────────────────────────────────────────────────────────────────
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# ── App structure ──────────────────────────────────────────────────────────────
WORKDIR /app

# Copy the project (everything that was inside SculptingVisWebApp/)
COPY . /app/

# Create dirs that settings.py expects
RUN mkdir -p /var/www/static/Artifacts \
             /var/log

# ── Static files ───────────────────────────────────────────────────────────────
# collectstatic needs DJANGO_SETTINGS_MODULE and a writable STATIC_ROOT
RUN DJANGO_SETTINGS_MODULE=svis.settings \
    python3 manage.py collectstatic --noinput

# ── DB migrations (SQLite — creates db.sqlite3 in /app) ───────────────────────
RUN DJANGO_SETTINGS_MODULE=svis.settings \
    python3 manage.py migrate --noinput

EXPOSE 8000

# Run with gunicorn; workers = 2×CPU+1 is standard, 2 works fine for dev/demo
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "svis.wsgi:application"]
