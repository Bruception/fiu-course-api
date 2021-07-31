import os, json, math, time, requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

SEP = '*' * 64
BASE_URL = 'https://m.fiu.edu/catalog/'
SUBJECT_URL = f'{BASE_URL}index.php?action=subjectList'
MAX_WORKERS = os.environ.get('MAX_WORKERS') or 50
OUTPUT_FILE = os.environ.get('OUTPUT_FILE') or 'data.json'

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
        response = requests.get(f'{BASE_URL}{href}')
        soup = BeautifulSoup(response.text, 'html.parser')
        time.sleep(0.1)
        return parseFunction(soup, href)
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futureToData = {executor.submit(getParsedData, obj): obj for obj in data}
        for future in as_completed(futureToData):
            try:
                data = future.result()
                completeFunction(data, parsedData)
            except Exception as exception:
                print(exception)
    return parsedData

def courseKey(course):
    return course['subject'] + course['code']

def writeCoursesToJSON():
    response = requests.get(SUBJECT_URL)
    soup = BeautifulSoup(response.text, 'html.parser')
    subjectURLS = soup.find('fieldset').ul.find_all('a')
    courseURLS = parseData(subjectURLS, getParsedSubject, extendCourseURLS)
    parsedCourses = sorted(parseData(courseURLS, getParsedCourse, appendCourseData), key=courseKey)
    print(f'{SEP}\nWriting course data to data.json ...\n{SEP}')
    with open(OUTPUT_FILE, 'w') as output:
        json.dump({'data': parsedCourses}, output, default=lambda o: o.__dict__, indent=4)
    return parsedCourses

def truncate(number, digits) -> float:
    stepper = 10.0 ** digits
    return math.trunc(stepper * number) / stepper

start = time.time()
courses = writeCoursesToJSON()
end = time.time()

print(f'Finished parsing {len(courses)} courses in {truncate(end - start, 3)} seconds!')
