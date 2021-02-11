from django.urls import path, re_path

from . import views

urlpatterns = [
    path('showtype/<str:typ>/', views.showtype),
    path('showtypeclass/<str:typ>/<str:clss>/', views.showtypeclass),
    path('showtypefamily/<str:typ>/<str:fam>/', views.showtypefam),
    path('download/<str:uuids>', views.downloadselection),
    path('downloadartifact/<str:uuid>', views.downloadartifact),
    path('deleteselectedartifacts/<str:uuids>', views.deleteselectedartifacts),
    path('upload_cmap', views.upload_cmap),
    path('pullFromRemoteLibrary/<str:host>/<str:uuid>', views.pullFromRemoteLibrary),
    path('hideArtifact/<str:uuid>', views.hideArtifact),
    re_path(r'copyArtifactLocal/(?P<path>.*)/(?P<uuid>[\w\d\.\-_]+)/$', views.copyArtifactLocal),
    path('', views.library, name='index'),
]
