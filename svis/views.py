from django.shortcuts import render

def applets(request):
  return render(request, 'index.html', {})