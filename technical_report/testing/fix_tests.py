import sys, os, json
from collections import OrderedDict

replaceMap = [
  {
    "tag": "name",
    "tagIs": "files",
    "path": ["item"],
    "fix": [
      {
        "tag": "name",
        "tagIs": "POST file not logged in",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file video logged in user_id 2 (joe)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/Joe'sVideo1.mp4"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file audio logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/Catas & Kasger - Blueshift.mp3"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file image logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BusyCat.jpg"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file video logged in user_id 1 token (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/wat - Gary Bernhardt CodeMash 2012 Lightning Talk.mp4"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file large video logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/The Birth & Death of JavaScript - Gary Bernhardt PyCon 2014.mp4"
            }
          }
        ]
      }
    ]
  },
  {
    "tag": "name",
    "tagIs": "files_no_delete",
    "path": ["item"],
    "fix": [
      {
        "tag": "name",
        "tagIs": "POST file doc logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file video logged in user_id 2 (joe)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/Joe'sVideo1.mp4"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file audio logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/Catas & Kasger - Blueshift.mp3"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file image logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BusyCat.jpg"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file video logged in user_id 1 token (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/wat - Gary Bernhardt CodeMash 2012 Lightning Talk.mp4"
            }
          }
        ]
      },
      {
        "tag": "name",
        "tagIs": "POST file large video logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/The Birth & Death of JavaScript - Gary Bernhardt PyCon 2014.mp4"
            }
          }
        ]
      }
    ]
  },
  {
    "tag": "name",
    "tagIs": "playlists",
    "path": ["item"],
    "fix": [
      {
        "tag": "name",
        "tagIs": "POST file logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
            }
          }
        ]
      }
    ]
  },
  {
    "tag": "name",
    "tagIs": "comments",
    "path": ["item"],
    "fix": [
      {
        "tag": "name",
        "tagIs": "POST file logged in user_id 1 (bob)",
        "path": ["request","body","formdata"],
        "fix": [
          {
            "tag":"key",
            "tagIs":"file",
            "replace": {
              "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
            }
          }
        ]
      }
    ]
  }
]

brokeTestFilePath = os.path.join(os.path.dirname(__file__),"MeTube-API.postman_collection.json")
fixedTestFilePath = os.path.join(os.path.dirname(__file__),"MeTube-API.postman_collection_fixed.json")
testFile = open(brokeTestFilePath,'r')
testDict = json.load(testFile, object_pairs_hook=OrderedDict)
testFile.close()

def apply_fixes():
  folders = testDict['item']
  apply_fix(folders, replaceMap)

def apply_fix(nodesArr, specs):
  # loop over list of nodes
  for curNode in nodesArr:
    # find tag we are working with if any
    curSpec = False
    for spec in specs:
      tag = spec['tag']
      if tag in curNode and curNode[tag] == spec['tagIs']:
        curSpec = spec
        break
    if not curSpec:
      continue
    # we have a node and a tag that applies
    destNode = curNode
    # follow path if any
    if 'path' in curSpec:
      for part in curSpec['path']:
        if part not in destNode:
          print("Error: path piece",part,"not in",destNode)
          exit(1)
        destNode = destNode[part]
    # recursive call to continue fixes on a deeper level
    if 'fix' in curSpec:
      apply_fix(destNode, curSpec['fix'])
    # apply replacement fixes
    if 'replace' in curSpec:
      subs = curSpec['replace']
      for key,val in subs.items():
        if key in destNode:
          destNode[key] = val

def write_fixed():
  with open(fixedTestFilePath,'w') as out:
    json.dump(testDict, out, indent='\t')

apply_fixes()
write_fixed()
