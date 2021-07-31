
const searchBar = document.querySelector('#search-bar');
const resultsContainer = document.querySelector('#results');
const modal = document.querySelector('#course-modal');
const closeModalButtons = document.querySelectorAll('.close-modal');

const courseMap = {}

const modalChildren = {
    title: modal.querySelector('.modal-card-title'),
    description: modal.querySelector('.course-description'),
    units: modal.querySelector('.course-units'),
}

closeModalButtons.forEach((button) => {
    button.addEventListener('click', () => {
        modal.classList.toggle('is-active');
    });
});

const fetchAPI = async (query = {}) => {
    const queryString = new URLSearchParams(query).toString();
    const response = await fetch(`/api?${queryString}`);
    return await response.json();
}

const debounce = (func, ms = 500) => {
    let timerID = 0;
    return (...args) => {
      clearTimeout(timerID);
      timerID = setTimeout(func.bind(this, ...args), ms);
    }
}

const courseTemplate = 
`<a class='panel-block has-icons-left'>
    <span class='panel-icon is-left'>
        <i class='icon fas fa-angle-right' aria-hidden='true'></i>
    </span>
    <span class='tag is-info course-code'>COP 2210</span>
    <span class='course-name'>Computer Programming</span>
</a>`

const openModal = (e) => {
    const target = e.currentTarget;
    modal.classList.toggle('is-active');
    const courseKey = target.getAttribute('course-id');
    const course = courseMap[courseKey];
    modalChildren.title.innerHTML = `${courseKey} - ${course.name}`;
    modalChildren.description.innerHTML = course.description;
    modalChildren.units.innerHTML = course.units;
}

const buildCourseTemplate = (course) => {
    const courseContainer = document.createElement('div');
    courseContainer.innerHTML = courseTemplate;
    const courseCode = courseContainer.querySelector('.course-code');
    const courseName = courseContainer.querySelector('.course-name');
    const rootContainer = courseContainer.querySelector('.panel-block');
    rootContainer.addEventListener('click', openModal);
    const courseKey = `${course.subject} ${course.code}`;
    rootContainer.setAttribute('course-id', courseKey);
    courseCode.innerHTML = `${course.subject} ${course.code}`;
    courseName.innerHTML = course.name;
    courseMap[courseKey] = course;
    return courseContainer.firstChild;
}

const search = async ({ target: { value } }) => {
    const query = {
        keywords: value,
    };
    const { total, results } = await fetchAPI(query);
    if (!results) {
        return;
    }
    resultsContainer.innerHTML = '';
    results.forEach((course) => {
        resultsContainer.append(buildCourseTemplate(course));
    });
}

searchBar.addEventListener('keyup', debounce(search));

window.onload = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const { query } = Object.fromEntries(urlSearchParams.entries());
    if (query) {
        searchBar.value = query;
        search({ target: { value: query } });
    }
}
