import path from 'path';
import fs from 'fs';
import del from 'del';
import assert from 'assert';
import extractModuleDependenciesFromGlob from '../src';

const trim = (str) => {
    return str.replace(/^\s+|\s+$/, '');
};

describe('Extract module dependencies from glob', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');

    fs.readdirSync(fixturesDir).map((caseName) => {
        it(`should ${caseName.split('-').join(' ')}`, () => {
            const fixtureDir = path.join(fixturesDir, caseName);

            del.sync(path.join(fixtureDir, 'expected/*.js'));

            extractModuleDependenciesFromGlob([path.join(fixtureDir, '/Component/*.js')], {
                saveFilePath: path.join(fixtureDir, 'expected'),
                saveFileExt: 'js',
                saveFileName: 'Component',
                modulesPath: path.join(fixtureDir, '/Component'),
            });

            const expected = fs.readFileSync(path.join(fixtureDir, 'expected/Component.js')).toString();

            const actual = fs.readFileSync(path.join(fixtureDir, './actual.js')).toString();

            assert.equal(trim(actual), trim(expected));
        });
    });
});
