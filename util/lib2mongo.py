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

for a in glob(ldir + '/*/artifact.json'):
  print(a)
  try:
    f = open(a)
    j = json.load(f)
    sv[dbname].insert_one(j)
  except:
    print("Error in " + a)
