from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
  path('', views.applets),
  path('load_applet/<str:applet>/', views.load_applet),
  path('upload_color_loom/', views.upload_color_loom),
  path('upload_texture_looper/', views.upload_texture_looper),
  path('upload_infinite_line/', views.upload_infinite_line),
  path('upload_glyph/', views.upload_glyph),
]
