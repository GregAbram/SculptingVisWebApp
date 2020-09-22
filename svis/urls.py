from django.urls import include, path
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from . import views

urlpatterns = [
    path('', views.applets),
    path('library/', include('library.urls')),
    path('applets/', include('applets.urls')),
    path('admin/', admin.site.urls),
] + staticfiles_urlpatterns()
