import os
import sys
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
import json

from pymongo import MongoClient

def artifact_name(i):
  return i['uuid']

def hideArtifact(request, uuid):
  try:
    mongo = MongoClient('localhost', 27017)
    db = mongo.SculptingVis
    collection = db[settings.MONGO_DBNAME]
    collection.update_one({'uuid': uuid}, {'$set': {"hidden": True}})
    with open(settings.ARTIFACTS + '/' + uuid + '/artifact.json', 'r') as f:
      j = json.load(f)
    j['hidden'] = True
    with open(settings.ARTIFACTS + '/' + uuid + '/artifact.json', 'w') as f:
      json.dump(j,f)
  except Exception as e:
    print('Failed to hide artifact', e)
    return HttpResponse('Failed to hide artifact', 500)
  return HttpResponse("OK")

def copyArtifactLocal(request, path, uuid):
  print("copy ", settings.ARTIFACTS + "/" + uuid, '/' + path)
  try:
    shutil.copytree(settings.ARTIFACTS + "/" + uuid, '/' + path)
    return HttpResponse("OK")
  except:
    return HttpResponse("copy failed")

def pullFromRemoteLibrary(request, host, uuid):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  members = list(collection.find({'uuid': uuid}))
  if len(members) > 0:
    print(uuid, "found here already")
    m = members[0]
    if m['hidden']:
      import json
      print("it was hidden...", settings.ARTIFACTS + "/" + uuid + "/artifact.json")
      f = open(settings.ARTIFACTS + "/" + uuid + "/artifact.json")
      try:
        j = json.load(f)
      except:
        print('failed to load JSON')
        return HttpResponse("OK")
      f.close()
      j['hidden'] = False
      f = open(settings.ARTIFACTS + "/" + uuid + "/artifact.json", "w")
      json.dump(j, f, indent=2, sort_keys=True)
      f.close()
      collection.replace_one({'uuid': uuid}, j)
    else:
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
  families = collection.find({'type': typ, 'hidden': False}).distinct('family')
  classes = collection.find({'type': typ, 'hidden': False}).distinct('class')
  grid = [[""] + classes]
  for f in families:
    row = [f]
    for c in classes:
      doc = collection.find_one({'type': typ, 'family': f, 'class': c, 'hidden': False})
      if (doc):
        row.append(artifact_name(doc))
      else:
        row.append(False)
    grid.append(row)
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 45
  else:
    wid = 100
    ht = 100
  params = { 'label': typ, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)

def showtypefam(request, typ, fam):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  classes = collection.find({'type': typ, 'hidden': False}).distinct('class')
  columns = []
  maxl = 0
  for c in classes:
    column = [artifact_name(c) for c in collection.find({'type': typ, 'family': fam, 'class': c, 'hidden': False})]
    if len(column) > maxl: maxl = len(column)
    columns.append(column)
  for i in range(len(columns)):
    columns[i] = columns[i] + [False]*(maxl - len(columns[i]))
  grid = [[""] + classes]
  for i in range(maxl):
    row = [""] + [columns[j][i] for j in range(len(classes))]
    grid.append(row)
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 45
  else:
    wid = 100
    ht = 100
  params = { 'label': typ + ' ' + fam, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)

def showtypeclass(request, typ, clss):
  mongo = MongoClient('localhost', 27017)
  db = mongo.SculptingVis
  collection = db[settings.MONGO_DBNAME]
  families = collection.find({'type': typ, 'hidden': False}).distinct('family')
  rows = []
  maxl = 0
  for f in families:
    row = [artifact_name(c) for c in collection.find({'type': typ, 'family': f, 'class': clss, 'hidden': False})]
    if len(row) > maxl: maxl = len(row)
    rows.append(row)
  for i in range(len(rows)):
    print(rows[i])
    rows[i] = rows[i] + [False]*(maxl - len(rows[i]))
  grid = [[""]*maxl]
  for i in range(len(families)):
    rows[i] = [families[i]] + rows[i]
    grid.append(rows[i])
  if typ == 'colormap' or typ == 'line':
    wid = 200
    ht = 45
  else:
    wid = 100
    ht = 100
  params = { 'label': typ + ' ' + clss, 'grid': grid, 'width': wid, 'height': ht}
  return render(request, 'library/grid.html', params)

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
  if request.META['SERVER_NAME'] == 'localhost' or request.META['SERVER_NAME'] == '127.0.0.1':
    local = True
  else:
    local = False
  return render(request, 'library/library.html', {'islocal': local})

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

def downloadartifact(request, uuid):
  with open(settings.ARTIFACTS + '/' + uuid + '/artifact.json') as f:
    desc = json.load(f)
  typ = desc['type']
  if typ == 'glyph':
    file = desc['artifactData'][0]['mesh']
  elif typ == 'colormap':
    file = desc['artifactData']['colormap']
  elif typ == 'line':
    file = desc['artifactData']['horizontal']
  elif typ == 'texture':
    file = desc['artifactData']['image']
  ext = file.rsplit('.')[1]
  artifact_name = typ + '_' + desc['class'] + '_' + desc['family'] + '.' + ext
  fullname = settings.ARTIFACTS + '/' + uuid + '/' + file
  file = open(fullname, 'rb')
  request.session['selections'] = []
  return FileResponse(file, as_attachment=True, filename=artifact_name)
