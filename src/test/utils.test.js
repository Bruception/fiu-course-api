const utils = require('../utils');

describe('utils: Test utility module functionality.', () => {
    test('utils.containsWord: Correctly determines if a word is present.', () => {
        const validString = 'This sentence contains the word contains.';
        expect(utils.containsWord(validString, 'contains')).toBe(true);
        expect(utils.containsWord(validString, 'boats')).toBe(false);
    });
    test('utils.error: Correctly returns error with defined properties.', () => {
        const error404 = utils.error('404!', 404);
        const error500 = utils.error('500!');
        expect(error404.message).toBe('404!');
        expect(error404.statusCode).toBe(404);
        expect(error500.message).toBe('500!');
        expect(error500.statusCode).toBe(500);
    });
});
