import sys, calendar, os, json, math, time, requests
from datetime import datetime
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

ENV = os.environ
SEP = '*' * 64
BASE_URL = 'https://m.fiu.edu/catalog/'
SUBJECT_URL = f'{BASE_URL}index.php?action=subjectList'
MAX_WORKERS = int(ENV.get('MAX_WORKERS') or 50)
MAX_RETRIES = int(ENV.get('MAX_RETRIES') or 5)
OUTPUT_FILE = ENV.get('OUTPUT_FILE') or 'data.json'
REQUEST_TIMEOUT = 30

def getParsedCourse(soup, href):
    courseData = soup.find('div', id='content')
    subject, code = courseData.div.h1.text.split()
    courseULS = courseData.find_all('ul')
    description = courseULS[1].li.find('p')
    return {
        'subject': subject,
        'code': code,
        'name': courseData.div.h2.text,
        'units': courseULS[0].find('p', {'class': 'data'}).text,
        'description': description.text if description else 'N/A',
    }

def getParsedSubject(soup, href):
    courseURLS = soup.find('fieldset').ul.find_all('a')
    return (href[-3:], courseURLS)

def appendCourseData(course, courses):
    print('Parsed', course['name'], '...')
    courses.append(course)

def extendCourseURLS(subject, courseURLS):
    subjectPrefix, urls = subject
    print('Fetched courses for subject', subjectPrefix, '...')
    courseURLS.extend(urls)

def parseData(data, parseFunction, completeFunction):
    parsedData = []
    def getParsedData(data):
        href = data.get('href')
        response = requests.get(f'{BASE_URL}{href}', timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'html.parser')
        time.sleep(0.1)
        return parseFunction(soup, href)
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futureToData = {executor.submit(getParsedData, obj): obj for obj in data}
        try:
            for future in as_completed(futureToData):
                data = future.result()
                completeFunction(data, parsedData)
        except Exception:
            executor.shutdown(wait=False, cancel_futures=True)
            raise
    return parsedData

def courseKey(course):
    return course['subject'] + course['code']

courseURLS = []

def writeCoursesToJSON():
    print('Starting course data fetch job.')
    global courseURLS
    if (not courseURLS):
        response = requests.get(SUBJECT_URL, timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'html.parser')
        subjectURLS = soup.find('fieldset').ul.find_all('a')
        courseURLS = parseData(subjectURLS, getParsedSubject, extendCourseURLS)
    parsedCourses = sorted(parseData(courseURLS, getParsedCourse, appendCourseData), key=courseKey)
    print(f'{SEP}\nWriting course data to data.json ...\n{SEP}')
    now = datetime.utcnow()
    unixTime = calendar.timegm(now.utctimetuple())
    with open(OUTPUT_FILE, 'w') as output:
        dataSchema = {
            'dataAsOf': unixTime,
            'data': parsedCourses,
        }
        json.dump(dataSchema, output, default=lambda o: o.__dict__, indent=4)
    return parsedCourses

def truncate(number, digits) -> float:
    stepper = 10.0 ** digits
    return math.trunc(stepper * number) / stepper

def init():
    success = False
    attempts = 0
    interval = 30.0
    exponentialRate = 1.75
    maxRetryDelay = 120.0
    while (not success):
        try:
            start = time.time()
            courses = writeCoursesToJSON()
            end = time.time()
            print(f'Finished parsing {len(courses)} courses in {truncate(end - start, 3)} seconds.')
            success = True
        except Exception as exception:
            print(exception)
            attempts += 1
            if (attempts > MAX_RETRIES):
                break
            print(f'Failed on attempt {attempts}. Retrying in {interval} second(s).')
            time.sleep(interval)
            interval *= (exponentialRate ** attempts)
            interval = truncate(min(interval, maxRetryDelay), 2)
    if (not success):
        print(f'Failed after {attempts} attempts. Exiting with status code 1.')
        sys.exit(1)

if (__name__ == '__main__'):
    init()
