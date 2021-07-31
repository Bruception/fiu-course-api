import os, json


MAX_WORKERS = os.environ.get('MAX_WORKERS') or 50

parsedCourses = {
    'test': 'test',
    'workers': MAX_WORKERS
}

with open('data.json', 'w') as output:
    json.dump({'data': parsedCourses}, output, default=lambda o: o.__dict__, indent=4)
