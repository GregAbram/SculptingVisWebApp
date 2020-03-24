from django.urls import path, re_path

from . import views

urlpatterns = [
    path('showtype/<str:typ>/', views.showtype),
    path('showtypeclass/<str:typ>/<str:clss>/', views.showtypeclass),
    path('showtypefamily/<str:typ>/<str:fam>/', views.showtypefam),
    path('download/<str:uuids>', views.downloadselection),
    path('deleteselectedartifacts/<str:uuids>', views.deleteselectedartifacts),
    path('receive/', views.UploadFormView.as_view()),
    path('receive/success/', views.success),
    path('upload_cmap', views.upload_cmap),
    path('pullFromRemoteLibrary/<str:host>/<str:uuid>', views.pullFromRemoteLibrary),
    path('', views.library, name='index'),
]
