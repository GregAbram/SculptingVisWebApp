import os
import shutil
from uuid import uuid1
from django.views.generic.edit import FormView
from django.http import HttpResponse, HttpResponseRedirect, FileResponse
from django.template import loader
from django.shortcuts import render
from django.urls import reverse
from django.utils.text import slugify
from django.conf import settings

from wsgiref.util import FileWrapper

import pdb
import tarfile
import tempfile

from pymongo import MongoClient

from .forms import UploadForm

def artifact_name(i):
  return i['uuid']

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
    members = list(collection.find(doc))
    doc['uuid'] = str(uuid1())
    doc['tags'] = []
    collection.insert_one(doc)
    dirname = settings.ARTIFACTS + '/' + artifact_name(doc) + '/'
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

def pullFromRemoteLibrary(request, host, uuid):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  members = list(collection.find({'uuid': uuid}))
  if len(members) > 0:
    print("DUPLICATE  + " + uuid);
  else:
    import urllib.request, io, tarfile, json
    url = 'http://' + host + '/library/download/' + uuid
    f = urllib.request.urlopen(url=url)
    barray = f.read()
    flo = io.BytesIO(barray)
    tfile = tarfile.open(fileobj=flo, mode='r')
    afile = ""
    for i in tfile.getnames():
      j = i.split('/')
      if j[-1] == 'artifact.json':
        uuid = j[0]
        afile = settings.ARTIFACTS + '/' + i
        break
    tfile.extractall(path=settings.ARTIFACTS)
    f = open(afile, 'r')
    j = json.load(f)
    collection.insert_one(j)
  return HttpResponse("OK")

def upload_cmap(request):
  if request.method == 'POST':
    form = Form(request.POST, request.FILES)
    mdata = json.loads(request.FILES['metadata'].read())
    print(mdata)
  return HttpResponse("OK")

def show(request):
  request.session['selections'] = []
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  types = ['colormap', 'texture'] + collection.distinct('type')
  params = { 'label': 'Artifacts', 'types': types, 'grid': [[]] }
  return render(request, 'library/browser.html', params)

def showtype(request, typ):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  tags = collection.distinct('tags')
  families = collection.find({'type': typ}).distinct('family')
  classes = collection.find({'type': typ}).distinct('class')
  grid = [[""] + classes]
  for f in families:
    row = [f]
    for c in classes:
      doc = collection.find_one({'type': typ, 'family': f, 'class': c})
      if (doc):
        row.append(artifact_name(doc))
      else:
        row.append('none')
    grid.append(row)
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 40
  else:
    wid = 100
    ht = 100
  params = { 'label': typ, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)

def showtypefam(request, typ, fam):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  classes = collection.find({'type': typ}).distinct('class')
  columns = []
  maxl = 0
  for c in classes:
    column = [artifact_name(c) for c in collection.find({'type': typ, 'family': fam, 'class': c})]
    if len(column) > maxl: maxl = len(column)
    columns.append(column)
  for i in range(len(columns)):
    columns[i] = columns[i] + ['none']*(maxl - len(columns[i]))
  grid = [[""] + classes]
  for i in range(maxl):
    row = [""] + [columns[j][i] for j in range(len(classes))]
    grid.append(row)
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 40
  else:
    wid = 100
    ht = 100
  params = { 'label': typ + ' ' + fam, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)

def showtypeclass(request, typ, clss):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  families = collection.find({'type': typ}).distinct('family')
  rows = []
  maxl = 0
  for f in families:
    row = [artifact_name(c) for c in collection.find({'type': typ, 'family': f, 'class': clss})]
    if len(row) > maxl: maxl = len(row)
    rows.append(row)
  for i in range(len(rows)):
    print(rows[i])
    rows[i] = rows[i] + ['none']*(maxl - len(rows[i]))
  grid = [[""]*maxl]
  for i in range(len(families)):
    rows[i] = [families[i]] + rows[i]
    grid.append(rows[i])
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 40
  else:
    wid = 100
    ht = 100
  params = { 'label': typ + ' ' + clss, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)
  print(clss)
  return showlib(request)

def deleteselectedartifacts(request, uuids):
  uuids = uuids.split(',')
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  trashdir = settings.BASE_DIR + '/trash'
  if not os.path.exists(trashdir):
    os.mkdir(trashdir)
  for uuid in uuids:
    collection.delete_one({'uuid': uuid})
    shutil.move(settings.ARTIFACTS + '/' + uuid, trashdir)
  return HttpResponse('OK')

def library(request):
  uploadForm = UploadForm()
  return render(request, 'library/library.html', {'uploadForm': uploadForm})

def success(request):
  return render(request, 'library/success.html', {})

def downloadselection(request, uuids):
  tmpdir = settings.BASE_DIR + '/tmp'
  if not os.path.exists(tmpdir):
    os.mkdir(tmpdir)
  fname = tmpdir + '/artifacts.tgz'
  tfile = tarfile.open(fname, 'w:gz')
  current_dir = os.getcwd()
  os.chdir(settings.ARTIFACTS)
  for uuid in uuids.split(','):
    tfile.add(uuid)
  tfile.close()
  os.chdir(current_dir)
  file = open(fname, 'rb')
  request.session['selections'] = []
  return FileResponse(file, as_attachment=True, filename='SculptingVis.tgz')
