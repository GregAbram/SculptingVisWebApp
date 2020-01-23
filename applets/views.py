from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.shortcuts import render
from django.urls import reverse
from django.forms import Form
from django.views.generic.edit import FormView
from django.conf import settings


import json, pdb, os
import numpy as np
from PIL import Image
from uuid import uuid1
from pymongo import MongoClient

from .forms import UploadForm

def artifact_name(i):
  return i['uuid']

def applets(request):
  return render(request, 'applets/applets.html', {})

def load_applet(request, applet):
  template = 'applets/' + applet + '.html'
  uploadForm = UploadForm()
  return render(request, template, {'uploadForm': uploadForm})

def upload_glyph(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)
    metadata = json.loads(request.FILES['metadata'].read())
    obj = request.FILES['obj'].read()
    f = open('/tmp/tst.ply', 'wb')
    f.write(obj)
    f.close()
    f = open('/home/gda/tmp/tst.ply', 'wb')
    f.write(obj)
    f.close()
  return HttpResponse("OK")

def upload_color_loom(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)
    object_family = form.data['family']
    object_class = form.data['clss']
    tsize = json.loads(request.FILES['thumbnail_size'].read())
    tpix = request.FILES['thumbnail_pixels'].read()
    print('YYYYYYYYYYYY', tpix)
    tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
    thumbnail = Image.fromarray(tpix)
    colormap = request.FILES['colormap'].read()
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    doc = {'type': 'colormap', 'family': object_family, 'class': object_class, 'uuid': str(uuid1()), 'tags': []}
    collection.insert_one(doc)
    dirname = settings.STATIC_ROOT + '/Artifacts/' + artifact_name(doc) + '/'
    os.mkdir(dirname)
    thumbnail.save(dirname + 'thumbnail.png')
    with open(dirname + 'colormap.xml', 'w') as d:
      for i in colormap.decode("utf-8").split(','):
        d.write(i)
    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['uuid'] = doc['uuid']
    a['tags'] = doc['tags']
    a['family'] = doc['family']
    a['class'] = doc['class']
    a['type'] = doc['type']
    a['artifactData'] = {'colormap': 'colormap.xml'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()

  return HttpResponse("OK")

def upload_infinite_line(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)

    metadata = json.loads(request.FILES['metadata'].read());
    object_family = metadata['family']
    object_class = metadata['class']

    names = json.loads(request.FILES['names'].read());
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    doc = {'type': 'line', 'family': object_family, 'class': object_class, 'uuid': str(uuid1()), 'tags': []}
    collection.insert_one(doc)

    dirname = settings.STATIC_ROOT + '/Artifacts/' + artifact_name(doc) + '/'
    os.mkdir(dirname)

    tsize = json.loads(request.FILES['thumbnail_size'].read())
    tpix = request.FILES['thumbnail_pixels'].read()
    tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
    thumbnail = Image.fromarray(tpix)
    thumbnail.save(dirname + 'thumbnail.png')

    for name in names:
      tsize = json.loads(request.FILES[name + '_size'].read())
      tpix = request.FILES[name + '_pixels'].read()
      tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
      png = Image.fromarray(tpix)
      png.save(dirname + name + '.png')

    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['uuid'] = doc['uuid']
    a['tags'] = doc['tags']
    a['family'] = doc['family']
    a['class'] = doc['class']
    a['type'] = doc['type']
    a['artifactData'] = {'vertical': 'vertical.png', 'horizontal': 'horizontal.png'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()

  return HttpResponse("OK")

def upload_texture_looper(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)

    object_family = form.data['family']
    object_class = form.data['clss']

    names = json.loads(request.FILES['names'].read());

    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    doc = {'type': 'texture', 'family': object_family, 'class': object_class, 'uuid': str(uuid1()), 'tags': []}
    collection.insert_one(doc)

    dirname = settings.STATIC_ROOT + '/Artifacts/' + artifact_name(doc) + '/'
    os.mkdir(dirname)

    tsize = json.loads(request.FILES['thumbnail_size'].read())
    tpix = request.FILES['thumbnail_pixels'].read()
    tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
    thumbnail = Image.fromarray(tpix)
    thumbnail.save(dirname + 'thumbnail.png')

    for name in names:
      tsize = json.loads(request.FILES[name + '_size'].read())
      tpix = request.FILES[name + '_pixels'].read()
      tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
      png = Image.fromarray(tpix)
      png.save(dirname + name + '.png')

    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['uuid'] = doc['uuid']
    a['tags'] = doc['tags']
    a['family'] = doc['family']
    a['class'] = doc['class']
    a['type'] = doc['type']
    a['artifactData'] = {'image': 'texturemap_0.png', 'normalmap': 'normalmap_0.png'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()

  return HttpResponse("OK")

class UploadFormView(FormView):
  form_class = UploadForm
  template_name = 'upload.html'
  success_url = 'success'

  def post(self, request, *args, **kwargs):
    form_class = self.get_form_class()
    form = self.get_form(form_class)
    object_type = form.data['type']
    object_family = form.data['family']
    object_class = form.data['clss']
    doc = {'type': object_type, 'family': object_family, 'class': object_class}
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    doc['uuid'] = str(uuid1())
    doc['tags'] = []
    collection.insert_one(doc)
    dirname = settings.STATIC_ROOT + '/Artifacts/' + artifact_name(doc) + '/'
    os.mkdir(dirname)
    files = request.FILES.getlist('files')
    if form.is_valid():
      for f in files:
        with open(dirname + f.name, 'wb+') as destination:
          print('file: ', f)
          for chunk in f.chunks():
              destination.write(chunk)
      return HttpResponse('success')
    else:
      return render(request, 'library/success.html', {})
