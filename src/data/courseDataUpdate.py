import json
import math
import time
import requests
import threading
import concurrent.futures
from bs4 import BeautifulSoup

SEP = '*' * 64
BASE_URL = 'https://m.fiu.edu/catalog/'
URL = f'{BASE_URL}index.php?action=subjectList&letter='

class CourseEncoder(json.JSONEncoder):
    def default(self, obj):
        if (isinstance(obj, Course)):
            return {
                'subject': obj.subject,
                'code': obj.code,
                'name': obj.name,
                'units': obj.units,
                'description': obj.description,
            }
        return json.JSONEncoder.default(self, obj)

class Course:
    def __init__(self, data):
        self.subject, self.code = data.div.h1.text.split()
        self.name = data.div.h2.text
        courseULS = data.find_all('ul')
        self.units = courseULS[0].find('p', {'class': 'data'}).text
        description = courseULS[1].li.find('p')
        self.description = description.text if description else 'N/A'        

def getCourses(courses):
    def getCourseInfo(course):
        courseHref = course.get('href')
        courseResponse = requests.get(f'{BASE_URL}{courseHref}')
        courseSoup = BeautifulSoup(courseResponse.text, 'html.parser')
        courseData = courseSoup.find('div', id='content')
        parsedCourse = Course(courseData)
        return parsedCourse
    courseData = []
    threads = min(30, len(courses))
    with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as executor:
        future_to_url = {executor.submit(getCourseInfo, course): course for course in courses}
        for future in concurrent.futures.as_completed(future_to_url):
            course = future_to_url[future]
            try:
                data = future.result()
                print(f'Parsed "{data.name}" ...')
                courseData.append(data)
            except Exception as exc:
                print(exc)
    return courseData

class CourseParser:
    def __init__(self, letter):
        self.letter = letter
        self.courses = []
        self.thread = threading.Thread(target=self.parse)
        self.thread.start()

    def parse(self):
        requestURL = f'{URL}{self.letter}'
        response = requests.get(requestURL)
        soup = BeautifulSoup(response.text, 'html.parser')
        listOfSubjects = soup.find('fieldset')
        for subject in listOfSubjects.ul.find_all('a'):
            subjectHref = subject.get('href')
            subjectResponse = requests.get(f'{BASE_URL}{subjectHref}')
            subjectSoup = BeautifulSoup(subjectResponse.text, 'html.parser')
            listOfCourses = subjectSoup.find('fieldset').ul
            self.courses.extend(getCourses(listOfCourses.find_all('a')))

    def join(self):
        self.thread.join()

def parseCourses(min, max):
    courses = []
    courseParsers = []
    for letter in range(ord(min), ord(max) + 1):
        l = chr(letter)
        print(f'Starting course parser for letter {l} ...')
        courseParsers.append(CourseParser(l))
    for courseParser in courseParsers:
        courseParser.join()
        courses.extend(courseParser.courses)
    output = open('data.json', 'w')
    output.write('{\n\t\"data\": [\n')
    print(f'{SEP}\nWriting course data to data.json ...\n{SEP}')
    isFirst = True
    for course in courses:
        if (not isFirst):
            output.write(',\n')
        output.write('\t\t')
        json.dump(course, output, cls=CourseEncoder)
        isFirst = False
    output.write("\n\t]\n}")
    output.close()
    return courses

def truncate(number, digits) -> float:
    stepper = 10.0 ** digits
    return math.trunc(stepper * number) / stepper

start = time.time()
courses = parseCourses('A', 'Z')
end = time.time()

print(f'Finished parsing {len(courses)} courses in {truncate(end - start, 3)} seconds!')
