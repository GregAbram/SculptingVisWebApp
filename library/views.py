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
    collection = db['curated']
    members = list(collection.find(doc))
    doc['uuid'] = str(uuid1())
    doc['tags'] = []
    collection.insert_one(doc)
    dirname = settings.STATIC_URL + '/Artifacts/' + artifact_name(doc) + '/'
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
  collection = db['curated']
  types = ['colormap', 'texture'] + collection.distinct('type')
  params = { 'label': 'Artifacts', 'types': types, 'grid': [[]] }
  return render(request, 'library/browser.html', params)

def showtype(request, typ):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db['curated']
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
  collection = db['curated']
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
  collection = db['curated']
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

def addselection(request, uuid):
  print("ADDSELECTION", request.session)
  found = 0
  if 'selections' in request.session:
    for s in request.session['selections']:
      if s['uuid'] == uuid:
        found = 1
        break
  if found == 0:
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    doc = collection.find_one({'uuid': uuid})
    print('doc:', doc)
    entry = {
      'uuid': uuid,
      'class': doc['class'],
      'family': doc['family']
    }
    if 'selections' not in request.session:
      request.session['selections'] = [ entry ]
    else:
      foo = request.session['selections'] + [entry]
      request.session['selections'] = foo
  params = {'selections': request.session['selections']}
  return render(request, 'library/selection.html', params)

def rmselection(request, uuid):
  print("RMSELECTION", request.session)
  old_selections = request.session['selections']
  new_selections = []
  for s in old_selections:
    if s['uuid'] != uuid:
      new_selections.append(s)
  request.session['selections'] = new_selections
  params = {'selections': request.session['selections']}
  return render(request, 'library/selection.html', params)

def clearselections(request):
  print("CLEARSELECTIONS", request.session)
  request.session['selections'] = []
  params = {'selections': request.session['selections']}
  return render(request, 'library/selection.html', params)

def deleteselectedartifacts(request):
  print("DELETESELECTEDARTIFACTS", request.session)
  if 'selections' in request.session:
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db['curated']
    trashdir = settings.STATIC_ROOT + '/trash'
    if not os.path.exists(trashdir):
      os.mkdir(trashdir)
    for s in request.session['selections']:
      print(s['uuid'])
      uuid = s['uuid']
      collection.delete_one({'uuid': uuid})
      shutil.move(settings.STATIC_ROOT + '/Artifacts/' + uuid, trashdir)
  request.session['selections'] = []
  return render(request, 'library/library.html', {'uploadForm': uploadForm})

def library(request):
  uploadForm = UploadForm()
  return render(request, 'library/library.html', {'uploadForm': uploadForm})

def success(request):
  return render(request, 'library/success.html', {})

def downloadselection(request):
  print("DOWNLOADSELECION", request.session)
  if 'uuid' not in request.session:
    request.session['uuid'] = str(uuid1())
  tmpdir = settings.STATIC_ROOT+ '/tmp/' + request.session['uuid']
  fname = tmpdir + '/artifacts.tgz'
  if not os.path.exists(tmpdir):
    os.mkdir(tmpdir)
  tfile = tarfile.open(fname, 'w:gz')
  current_dir = os.getcwd()
  os.chdir(settings.STATIC_ROOT + '/Artifacts')
  for selection in request.session['selections']:
    tfile.add(selection['uuid'])
  tfile.close()
  os.chdir(current_dir)
  file = open(fname, 'rb')
  request.session['selections'] = []
  print("XXXXXXXXXXXXXX")
  return FileResponse(file, as_attachment=True, filename='SculptingVis.tgz')
