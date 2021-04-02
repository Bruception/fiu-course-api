
const fetchAPI = async (queryString) => {
    const response = await fetch(`/api?${queryString}`);
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

const debounce = (func, ms = 500) => {
    let timerID = 0;
    return (...args) => {
      clearTimeout(timerID);
      timerID = setTimeout(func.bind(this, ...args), ms);
    }
}

const queryAPI = async (targetID, query, action) => {
    const data = await fetchAPI(query);
    const target = document.getElementById(targetID);
    target.innerHTML = action(data);
}
  
const queryKeyUp = ({ target: { value } }) => {
    if (value === '' || value.indexOf('&') !== -1) return;
    queryAPI('sample-response', `subject=${value}`, truncateData);
}

sampleQuery.addEventListener('keyup', debounce(queryKeyUp));

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
    'course-offerings': {
        query: '',
        action: (data) => data.results.length,
    },
    'zero-unit-courses': {
        query: 'units=0.00',
        action: (data) => data.results.length,
    },
}

window.onload = async () => {
    Object.keys(queryTemplate).forEach(async (key) => {
        const { query, action } = queryTemplate[key];
        await queryAPI(key, query, action || truncateData);
    });
}
