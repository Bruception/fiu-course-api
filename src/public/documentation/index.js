
const fetchAPI = async (endpoint, queryString = '') => {
    const response = await fetch(`/${endpoint}?${queryString}`);
    return await response.json();
}

const jsonStyleReplacement = [
    {
        regex: /(\"[a-z]+\"):/gi,
        value: 'prop',
        postfix: ':',
    },
    {
        regex: /([0-9]+),/gi,
        value: 'value-num',
    },
    {
        regex: /\: (\".+\"),?/gi,
        value: 'value-string',
        prefix: ': ',
    },
];

const truncateData = (data) => {
    const oldSize = data.results.length;
    data.results = data.results.slice(0, 3);
    data.results.forEach((course) => {
        if (!course.description) {
            return;
        }
        course.description = `${course.description.substring(0, 60)} ...`;
    });
    const dataString = jsonStyleReplacement.reduce((str, replacement) => {
        const begin = replacement.prefix || '';
        const end = replacement.postfix || ',';
        const tokenHTML = `${begin}<span class='json-token-${replacement.value}'>$1</span>${end}`
        return str.replaceAll(replacement.regex, tokenHTML);
    }, JSON.stringify(data, undefined, 2));
    if (oldSize > 3) {
        const lastBracketIndex = dataString.lastIndexOf(']');
        const prefix = dataString.substring(0, lastBracketIndex);
        const postfix = dataString.substring(lastBracketIndex);
        return `${prefix}  ...\n  ${postfix}`;
    }
    return dataString;
}

const sampleQuery = document.querySelector('#sample-subject-query');
const paginationSampleQuery = document.querySelector('#sample-pagination-query');

const debounce = (func, ms = 500) => {
    let timerID = 0;
    return (...args) => {
      clearTimeout(timerID);
      timerID = setTimeout(func.bind(this, ...args), ms);
    }
}

const queryAPI = async (targetID, query, action) => {
    const data = await fetchAPI('api', query);
    const target = document.getElementById(targetID);
    target.innerHTML = action(data);
}
  
const queryKeyUp = async ({ target: { value } }) => {
    if (value === '' || value.indexOf('&') !== -1) return;
    await queryAPI('sample-response', `subject=${value}`, truncateData);
}

const paginationKeyUp = async ({ target: { value } }) => {
    if (value === '' || value.indexOf('&') !== -1) return;
    await queryAPI('pagination-sample-response', `subject=CHM&limit=10&skip=${value}`, truncateData);   
}

sampleQuery.addEventListener('keyup', debounce(queryKeyUp));
paginationSampleQuery.addEventListener('keyup', debounce(paginationKeyUp));


const queryTemplate = {
    'sample-response': {
        query: 'subject=COP',
    },
    'combined-queries-response': {
        query: 'subject=J&code=1&units=5',
    },
    'multi-value-queries-response': {
        query: 'subject=AST&subject=COP&isLab',
    },
    'keywords-sample-query': {
        query: 'keywords=electric theory magnets'
    },
    'excludes-sample-query': {
        query: 'subject=SPN&excludes=subject code units description',
    },
    'pagination-sample-response': {
        query: 'subject=CHM&limit=10&skip=0',
    },
    'order-sample-query': {
        query: 'subject=CHM&limit=3&sortBy=units&reverseOrder'
    },
    'course-offerings': {
        query: 'excludes=*',
        action: (data) => data.total,
    },
    'zero-unit-courses': {
        query: 'units=0.00&excludes=*',
        action: (data) => data.total,
    },
}

window.onload = async () => {
    const appVersion = document.getElementById('app-version');
    appVersion.innerHTML = `v${(await fetchAPI('status')).version}`;
    Object.keys(queryTemplate).forEach(async (key) => {
        const { query, action } = queryTemplate[key];
        await queryAPI(key, query, action || truncateData);
    });
}
