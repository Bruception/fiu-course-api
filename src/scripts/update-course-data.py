import calendar, json, logging, math, os, requests, sys, time
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

ENV = os.environ
SEPARATOR = '*' * 64

BASE_URL = 'https://m.fiu.edu/catalog/'
SUBJECT_URL = f'{BASE_URL}index.php?action=subjectList'

OUTPUT_FILE = ENV.get('OUTPUT_FILE') or 'data.json'

MAX_WORKERS = int(ENV.get('MAX_WORKERS') or 50)
MAX_RETRIES_PER_JOB = int(ENV.get('MAX_RETRIES_PER_JOB') or 3)
REQUEST_TIMEOUT = 30
MAX_FAILURES = 40

logging.basicConfig(level=logging.INFO, format='%(message)s')

class ScrapeJob:
    def __init__(self, href):
        self.href = href
        self.data = None
        self.failures = 0
        self.completed = False
        self.retry_time = 1
    
    def fail(self):
        self.completed = False
        self.failures += 1

    def complete(self):
        self.completed = True
    
    def execute(self):
        pass
    
    def __repr__(self):
        return f'Failures: {self.failures}'

class CourseJob(ScrapeJob):
    def __init__(self, href):
        ScrapeJob.__init__(self, href)
    
    def __repr__(self):
        if (not self.data):
            return self.href

        subject = self.data['subject']
        code = self.data['code']
        
        return f'{subject} - {code} - {super().__repr__()}'
    
    def execute(self):
        response = requests.get(f'{BASE_URL}{self.href}', timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'html.parser')

        course_data = soup.find('div', id='content')
        subject, code = course_data.div.h1.text.split()
        course_uls = course_data.find_all('ul')
        description = course_uls[1].li.find('p')

        course_data =  {
            'subject': subject,
            'code': code,
            'name': course_data.div.h2.text,
            'units': course_uls[0].find('p', {'class': 'data'}).text,
            'description': description.text if description else 'N/A',
        }

        self.data = course_data

class SubjectJob(ScrapeJob):
    def __init__(self, code, name, href):
        ScrapeJob.__init__(self, href)
        self.code = code
        self.name = name

    def __repr__(self):
        return f'{self.code} - {self.name} - {super().__repr__()}'
    
    def execute(self):
        response = requests.get(f'{BASE_URL}{self.href}', timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'html.parser')

        course_anchors = soup.find('fieldset').ul.find_all('a')
        self.data = [CourseJob(course_anchor.get('href')) for course_anchor in course_anchors]

def get_subjects_data():
    response = requests.get(SUBJECT_URL, timeout=REQUEST_TIMEOUT)
    soup = BeautifulSoup(response.text, 'html.parser')

    return [
        {
            'code': subject_link.find('div', class_='listButton').text,
            'name': subject_link.find('div', class_='listText').text,
            'href': subject_link.get('href')
        }
        for subject_link in soup.find('fieldset').ul.find_all('a')
    ]

def worker(job):
    try:
        job.execute()
        job.complete()

        logging.info(f'Completed job: "{job}"')
        time.sleep(0.1)
    except Exception as exception:
        job.fail()

        logging.info(f'Failed job "{job}" with exception: {exception}')
        time.sleep(job.retry_time)
    
    return job

def write_courses_to_json(courses):
    logging.info(f'{SEPARATOR}\nWriting course data to {OUTPUT_FILE} ...\n{SEPARATOR}')

    def course_key(course):
        course_subject = course['subject']
        course_code = course['code']
        return f'{course_subject}{course_code}'

    now = datetime.utcnow()
    unix_time = calendar.timegm(now.utctimetuple())

    with open(OUTPUT_FILE, 'w') as output:
        data_schema = {
            'dataAsOf': unix_time,
            'data': sorted(courses, key=course_key),
        }
        json.dump(data_schema, output, default=lambda o: o.__dict__, indent=4)

def truncate(number, digits) -> float:
    stepper = 10.0 ** digits
    return math.trunc(stepper * number) / stepper

def main():
    start = time.perf_counter()

    logging.info('Initializing subject jobs...')
    jobs = []

    try :
        jobs = [SubjectJob(**subject_data) for subject_data in get_subjects_data()]
    except Exception:
        logging.info(f'FIU course catalog might be under maintenance... exiting with status code 1...')
        sys.exit(1)

    courses = []
    total_failures = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        while (jobs and total_failures < MAX_FAILURES):
            logging.info(f'{SEPARATOR}\n{len(jobs)} job(s) remaining...\n{SEPARATOR}')

            futures = {executor.submit(worker, job): job for job in jobs}
            jobs = []

            for future in as_completed(futures):
                job = future.result()

                if (job.completed):
                    if (isinstance(job, CourseJob)):
                        courses.append(job.data)
                    elif (isinstance(job, SubjectJob)):
                        jobs.extend(job.data)
                elif (not job.completed and job.failures < MAX_RETRIES_PER_JOB):
                    jobs.append(job)
                elif (job.failures >= MAX_RETRIES_PER_JOB):
                    logging.info(f'No more retries for job: "{job}"')
                    total_failures += 1 if isinstance(job, CourseJob) else 100

    if (total_failures >= MAX_FAILURES):
        logging.info(f'MAYDAY MAYDAY MAYDAY! Catastrophic failure: exiting with status code 1...')
        sys.exit(1)

    write_courses_to_json(courses)

    end = time.perf_counter()
    logging.info(f'Finished scraping {len(courses)} courses in {truncate(end - start, 3)} second(s).')

    sys.exit(0)
    
if (__name__ == '__main__'):
    main()
