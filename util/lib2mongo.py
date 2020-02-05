import sys

if len(sys.argv) != 2:
  print("syntax: ", sys.argv[0], " libraryDir")
  sys.exit(0)

from pymongo import MongoClient
import json
from glob import glob

sv = MongoClient()['SculptingVis']
print(sv, sv.list_collection_names())

if 'curated' in sv.list_collection_names():
  sv.drop_collection('curated')

for uuid in glob(sys.argv[1] + '/*'):
  if uuid != sys.argv[1] + "/none":
    print(uuid)
    f = open(uuid + '/artifact.json')
    j = json.load(f)
    f.close()
    d = {
      "class": j['class'],
      "family": j['family'],
      "uuid": j['uuid'],
      "type": j['type'],
      "tags": []
    }
    sv['curated'].insert_one(d)
