from django.urls import include, path
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path('', views.applets),
    path('accounts/login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path('library/', include('library.urls')),
    path('applets/', include('applets.urls')),
    path('admin/', admin.site.urls),
] + staticfiles_urlpatterns()