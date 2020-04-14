import json
from PIL import Image
from glob import glob

for i in glob('*/artifact.json'):
  d = i.split('/')[0]
  j = json.load(open(i))
  print(i, j['type'])
  if j['type'] == 'line':
    i = Image.open(d + "/horizontal.png")
    j = i.resize((int(i.size[0] * (40.0 / i.size[1])), 40))
    j.save(d + "/thumbnail.png")
  elif j['type'] == 'texture': 
    i = Image.open(d + "/texturemap_0.png")
    j = i.resize((int(i.size[0] * (100.0 / i.size[1])), 100))
    j.save(d + "/thumbnail.png")
  elif j['type'] == 'colormap':
    i = Image.open(d + "/thumbnail.png")
    j = i.resize((200, 30))
    j.save(d + "/thumbnail.png")
