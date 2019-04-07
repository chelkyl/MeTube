
import datetime
import json
from operator import itemgetter

# data must be a list of the same dict type
# options = {
#   filters: [{
#     any: (bool) found in any column (exact or contains)
#     column: string,
#     value:  string,
#     cmp: min, max, exact, contains, TODO: word_contains, fuzzy?
#   }],
#   sorters: [{
#     column: string,
#     descending: bool
#   }],
#   bounds: {
#     start: num,
#     limit: num,
#   }
# }
def passes_filters(filters, entry):
  values = [str(val).lower() for val in entry.values()]
  keep = True
  
  for f in filters:
    if f.get('any', False):
      fval = str(f['value']).lower()
      # tests if value appears in entry
      if f['cmp'] == 'exact':
        if fval not in values:
          keep = False
      else:
        # if f['cmp'] == 'contains' or other value
        found = False
        for value in values:
          if fval in value:
            found = True
            break
        if not found:
          keep = False
    else:
      # specific filter
      if f['column'] in entry.keys():
        if f['cmp'] == 'exact':
          if f['value'] != entry[f['column']]:
            keep = False
        elif f['cmp'] == 'contains':
          if f['value'] not in str(entry[f['column']]):
            keep = False
        elif f['cmp'] == 'min':
          oval = entry[f['column']]
          o_type = type(oval)
          if isinstance(o_type,str):
            print("Trying to compare min with string")
          elif isinstance(o_type,int):
            cval = int(f.value)
            if not (cval >= oval):
              keep = False
          elif isinstance(o_type,datetime.date):
            cval = datetime.date(f.value)
            if not (cval >= oval):
              keep = False
        elif f['cmp'] == 'max':
          oval = entry[f['column']]
          o_type = type(oval)
          if isinstance(o_type,str):
            print("Trying to compare max with string")
          elif isinstance(o_type,int):
            cval = int(f.value)
            if not (cval <= oval):
              keep = False
          elif isinstance(o_type,datetime.date):
            cval = datetime.date(f.value)
            if not (cval <= oval):
              keep = False
  return keep

def filter_sort_paginate(data,opts):
  if len(data) == 0:
    return []

  ret = []
  filters = opts['filters']
  sorters = opts['sorters']
  bounds  = opts['bounds']

  if filters:
    for entry in data:
      if passes_filters(filters, entry):
        ret.append(entry)
  else:
    ret = data

  if sorters:
    # sorted() handles multi sort stability (according to docs)
    for sorter in sorters:
      column = sorter['column']
      descending = sorter['descending'] in ['true','True']
      ret = sorted(ret, key=itemgetter(column), reverse=descending)

  if bounds:
    start = int(bounds['start']) if bounds['start'] else 0
    limit = int(bounds['limit']) if bounds['limit'] else len(ret)
    return ret[start:limit]
  return ret

# url args only for basic search opts
# more specific filters/options are in form data
#
# support:
# landing/home:
#   trending
#   ?type=file&daysAgo=14&sortDsc=views
#   best of 0001
#   ?type=file&upload_dateBeg=01-01-0001&upload_dateEnd=12-31-0001&sortDsc=views
# browse search (users, files, and playlists):
#   ?q=hello&sortDsc=views&start=5&limit=10
#   ?q=hello+world&tag=a&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
# browse search files:
#   ?type=file&q=hello+world&tag=a&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
# browse search users/channels:
#   ?type=user?q=bob+jo&sortAsc=uploads&start=0&limit=1
#   ?type=user?q=bob+jo&uploadsMin=20&subsMin=5
# user channel (files):
#   user_id=1&perms=1&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
#   playlist_id=2&...
# user channel (playlist):
#   user_id=2&name=favorites...
#   user_id=2&creation_date=01-01-0001&...
# user channel (contacts):
#   user_id=2
#   user_id=2&daysAgo=14
#   user_id=2&dateBeg=01-01-0001
# user channel (subscriptions):
#   name=Best+Channel&subsMin=20
#
def get_request_opts(req):
  opts = {
    'filters': req.args.getlist('filters[]'),
    'sorters': req.args.getlist('sorters[]'),
    'bounds': {
      'start': req.args.get('b',0),
      'limit': req.args.get('l',None)
    }
  }
  opts['filters'] = list(map(lambda f: json.loads(f) if isinstance(f,str) else f, opts['filters']))
  opts['sorters'] = list(map(lambda s: json.loads(s) if isinstance(s,str) else s, opts['sorters']))

  if req.is_json:
    if 'filters' in req.json:
      opts['filters'] = req.json['filters']
    if 'sorters' in req.json:
      opts['sorters'] = req.json['sorters']

  if 'q' in req.args:
    opts['filters'].append({
      'any': True,
      'value': req.args.get('q'),
      'cmp': 'contains'
    })

  return opts
