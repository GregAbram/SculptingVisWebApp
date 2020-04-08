from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.shortcuts import render
from django.urls import reverse
from django.forms import Form
from django.views.generic.edit import FormView
from django.conf import settings

import json, pdb, os, sys
import numpy as np
from PIL import Image
from uuid import uuid1
from pymongo import MongoClient
import subprocess

from .forms import UploadForm

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
    uuid = str(uuid1())
    dirname = settings.STATIC_ROOT + '/Artifacts/' + uuid + '/'
    os.mkdir(dirname)
    f = open(dirname + '/original.obj', 'wb')
    f.write(obj)
    f.close()
    obj = request.FILES['thumbnail'].read()
    f = open(dirname + '/thumbnail.png', 'wb')
    f.write(obj)
    f.close()
    object_family = metadata['family']
    object_class = metadata['class']
    os.environ["PATH"] += os.pathsep + settings.BLENDER_PATH
    blender_args = ['/bin/bash']
    blender_args.append(settings.STATIC_ROOT + 'glyph-aligner/run_blender.sh')
    blender_args.append(settings.STATIC_ROOT + 'glyph-aligner/Automating_lod_mapping.py')
    blender_args.append(dirname + '/original.obj')
    print("BLENDER command: ", ' '.join(blender_args))
    try:
      os.system(' '.join(blender_args))
    except:
      print('BLENDER could not be run')
    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['hidden'] = False
    a['uuid'] = uuid
    a['tags'] = []
    a['family'] = object_family
    a['class'] = object_class
    a['type'] = 'glyph'
    a['artifactMaterials'] = { 'clay': True }
    a['artifactData'] = {
      'lods': [
        {
          'mesh': 'LOD1.obj',
          'normal': 'LOD1.png'
        },
        {
          'mesh': 'LOD2.obj',
          'normal': 'LOD2.png'
        },
        {
          'mesh': 'LOD3.obj',
          'normal': 'LOD3.png'
        }
      ]
    }
    f = open(dirname + '/artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db[settings.MONGO_DBNAME]
    collection.insert_one(a)
  return HttpResponse('OK')

def upload_color_loom(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)
    metadata = json.loads(request.FILES['metadata'].read());
    object_family = metadata['family']
    object_class = metadata['class']
    colormap = request.FILES['colormap'].read()
    uuid = str(uuid1())
    dirname = settings.STATIC_ROOT + '/Artifacts/' + uuid + '/'
    os.mkdir(dirname)
    tsize = json.loads(request.FILES['thumbnail_size'].read())
    tpix = request.FILES['thumbnail_pixels'].read()
    tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
    thumbnail = Image.fromarray(tpix)
    thumbnail = thumbnail.resize((200, 30))
    thumbnail.save(dirname + 'thumbnail.png')
    with open(dirname + 'colormap.xml', 'w') as d:
      for i in colormap.decode('utf-8').split(','):
        d.write(i)
    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['hidden'] = False
    a['uuid'] = uuid
    a['tags'] = []
    a['family'] = object_family
    a['class'] = object_class
    a['type'] = 'colormap'
    a['artifactData'] = {'colormap': 'colormap.xml'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db[settings.MONGO_DBNAME]
    collection.insert_one(a)

  return HttpResponse('OK')

def upload_infinite_line(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)
    metadata = json.loads(request.FILES['metadata'].read());
    object_family = metadata['family']
    object_class = metadata['class']
    names = json.loads(request.FILES['names'].read());

    uuid = str(uuid1())
    dirname = settings.STATIC_ROOT + '/Artifacts/' + uuid + '/'
    os.mkdir(dirname)

    for name in names:
      tsize = json.loads(request.FILES[name + '_size'].read())
      tpix = request.FILES[name + '_pixels'].read()
      tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
      png = Image.fromarray(tpix)
      png.save(dirname + name + '.png')

    thumbnail = Image.open(dirname + '/horizontal.png')
    thumbnail = thumbnail.resize((int(thumbnail.size[0] * (40.0 / thumbnail.size[1])), 40))
    thumbnail.save(dirname + 'thumbnail.png')

    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['hidden'] = False
    a['uuid'] = uuid
    a['tags'] = []
    a['family'] = object_family
    a['class'] = object_class
    a['type'] = 'line'
    a['artifactData'] = {'vertical': 'vertical.png', 'horizontal': 'horizontal.png'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db[settings.MONGO_DBNAME]
    collection.insert_one(a)

  return HttpResponse('OK')

def upload_texture_looper(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)

    object_family = form.data['family']
    object_class = form.data['clss']

    names = json.loads(request.FILES['names'].read());

    uuid = str(uuid1())
    dirname = settings.STATIC_ROOT + '/Artifacts/' + uuid + '/'
    os.mkdir(dirname)

    for name in names:
      tsize = json.loads(request.FILES[name + '_size'].read())
      tpix = request.FILES[name + '_pixels'].read()
      tpix = np.frombuffer(tpix, dtype='uint8').reshape((tsize['height'], tsize['width'], 4))[:,:,0:3]
      png = Image.fromarray(tpix)
      png.save(dirname + name + '.png')

    thumbnail = Image.open(dirname + '/texturemap_0.png')
    thumbnail = thumbnail.resize((int(thumbnail.size[0] * (100.0 / thumbnail.size[1])), 100))
    print("XXXXXXXX ", thumbnail.size)
    thumbnail.save(dirname + '/thumbnail.png')

    a = {'artist': 'Francesca Samsel', 'preview': 'thumbnail.png'}
    a['hidden'] = False
    a['uuid'] = uuid
    a['tags'] = []
    a['family'] = object_family
    a['class'] = object_class
    a['type'] = 'texture'
    a['artifactData'] = {'image': 'texturemap_0.png', 'normalmap': 'normalmap_0.png'}
    f = open(dirname + 'artifact.json', 'w')
    f.write(json.dumps(a, sort_keys=True, indent=4))
    f.close()

    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db[settings.MONGO_DBNAME]
    collection.insert_one(a)

  return HttpResponse('OK')

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
    collection = db[settings.MONGO_DBNAME]
    collection.insert_one(doc)
    uuid = str(uuid1())
    dirname = settings.STATIC_ROOT + '/Artifacts/' + uuid + '/'
    os.mkdir(dirname)
    files = request.FILES.getlist('files')
    if form.is_valid():
      for f in files:
        with open(dirname + f.name, 'wb+') as destination:
          for chunk in f.chunks():
              destination.write(chunk)
      return HttpResponse('success')
    else:
      return render(request, 'library/success.html', {})
