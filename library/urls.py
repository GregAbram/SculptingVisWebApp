from django.urls import path, re_path

from . import views

urlpatterns = [
    path('showtype/<str:typ>/', views.showtype),
    path('showtypeclass/<str:typ>/<str:clss>/', views.showtypeclass),
    path('showtypefamily/<str:typ>/<str:fam>/', views.showtypefam),
    path('addselection/<str:uuid>/', views.addselection),
    path('rmselection/<str:uuid>/', views.rmselection),
    path('pulldown/', views.downloadselection),
    path('clear/', views.clearselections),
    path('deleteselectedartifacts/', views.deleteselectedartifacts),
    path('receive/', views.UploadFormView.as_view()),
    path('receive/success/', views.success),
    path('upload_cmap', views.upload_cmap),
    path('', views.library, name='index'),
]
