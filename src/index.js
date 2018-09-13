import fs from 'fs';
import path from 'path';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import glob from 'glob-all';

import getTraverser from './traverser';

const ENCODING = 'utf8';
const BABEL_PARSING_OPTS = {
    sourceType: 'module',
    plugins: [
        'jsx',
        'flow',
        'doExpressions',
        'objectRestSpread',
        'decorators',
        'classProperties',
        'exportExtensions',
        'asyncGenerators',
        'functionBind',
        'functionSent',
        'dynamicImport',
    ],
};
const noop = () => {};
const jsExtLength = '.js'.length;
const mustacheExt = '.mustache';
const backslashLength = '/'.length;

const extractModuleDependenciesFromCode = (code, opts = {}, cb = noop) => {
    try {
        const ast = babylon.parse(code.toString(ENCODING), BABEL_PARSING_OPTS);
        const traverser = getTraverser(cb, opts);

        traverse(ast, traverser);
    } catch (ignore) {}
};

export const extractModuleDependenciesFromFile = (file, opts = {}, cb = noop) => {
    extractModuleDependenciesFromCode(
        fs.readFileSync(file, ENCODING),
        {
            ...opts,
            filename: file,
        },
        cb
    );
};

const extractModuleTreeDependenciesFromFile = (file, opts = {}) => {
    const cachedFiles = {};
    let dependencyList = [];

    function _extractModuleTreeDependenciesFromFile(file, opts) {
        let moduleDependecies = [];

        extractModuleDependenciesFromFile(file, opts, (_moduleDependecies) => {
            dependencyList = dependencyList.concat(_moduleDependecies);
            moduleDependecies = _moduleDependecies;
        });

        moduleDependecies.forEach((file) => {
            if (!cachedFiles[file]) {
                _extractModuleTreeDependenciesFromFile(file, opts);
                cachedFiles[file] = true;
            }
        });
    }

    _extractModuleTreeDependenciesFromFile(file, opts);

    return [...new Set(dependencyList)];
};

export default (globArr, opts = {}) => {
    const saveFilePath = path.resolve(opts.saveFilePath);
    let previousContent;

    let staticValues = glob.sync(globArr).reduce((dependencies, file) => {
        const staticValues = extractModuleTreeDependenciesFromFile(file, opts);
        dependencies = dependencies.concat([file], staticValues);
        return dependencies;
    }, []);

    const modulesPath = path.resolve(__dirname, opts.modulesPath);

    staticValues = [...new Set(staticValues.map((item) => item.slice(modulesPath.length + backslashLength)))];

    if (fs.existsSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`)) {
        previousContent = fs
            .readFileSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`, ENCODING)
            .toString();
    }

    const content = opts.template ? opts.template(staticValues) : JSON.stringify(staticValues);

    if (content !== previousContent) {
        fs.writeFileSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`, content);
    }
};
