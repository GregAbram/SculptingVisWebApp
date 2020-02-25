import sys

if len(sys.argv) != 3:
  print("syntax: ", sys.argv[0], " libraryDir dbname")
  sys.exit(0)

ldir = sys.argv[1]
dbname = sys.argv[2]

from pymongo import MongoClient
import json
from glob import glob

sv = MongoClient()['SculptingVis']
print(sv, sv.list_collection_names())

if dbname in sv.list_collection_names():
  sv.drop_collection(dbname)

for uuid in glob(ldir + '/*'):
  if uuid != ldir + "/none":
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
    sv[dbname].insert_one(d)
