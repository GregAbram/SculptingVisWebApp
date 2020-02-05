"""
WSGI config for svis project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import sys
print("WSGI PYTHON VERSION", sys.version) 
print("TEST wsgi.py")

for i in sys.path:
  print(">>", i)

import os

print("XXXXXXXXXXXXXXX", os.getcwd())
from django.core.wsgi import get_wsgi_application
#os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'svis-test.settings')
os.environ["DJANGO_SETTINGS_MODULE"] = "svis.settings"
print("XXXXXXXXXXXXXXX 111", os.getcwd())
application = get_wsgi_application()
print("WSGI DJANGO running")
