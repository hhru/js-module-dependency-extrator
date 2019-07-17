'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.extractModuleDependenciesFromFile = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _babylon = require('babylon');

var babylon = _interopRequireWildcard(_babylon);

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _globAll = require('glob-all');

var _globAll2 = _interopRequireDefault(_globAll);

var _traverser = require('./traverser');

var _traverser2 = _interopRequireDefault(_traverser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ENCODING = 'utf8';
var BABEL_PARSING_OPTS = {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'doExpressions', 'objectRestSpread', 'decorators', 'classProperties', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport']
};
var noop = function noop() {};
var jsExtLength = '.js'.length;
var mustacheExt = '.mustache';
var backslashLength = '/'.length;

var extractModuleDependenciesFromCode = function extractModuleDependenciesFromCode(code) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

    try {
        var ast = babylon.parse(code.toString(ENCODING), BABEL_PARSING_OPTS);
        var traverser = (0, _traverser2.default)(cb, opts);

        (0, _babelTraverse2.default)(ast, traverser);
    } catch (ignore) {}
};

var extractModuleDependenciesFromFile = exports.extractModuleDependenciesFromFile = function extractModuleDependenciesFromFile(file) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

    extractModuleDependenciesFromCode(_fs2.default.readFileSync(file, ENCODING), _extends({}, opts, {
        filename: file
    }), cb);
};

var extractModuleTreeDependenciesFromFile = function extractModuleTreeDependenciesFromFile(file) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var cachedFiles = {};
    var dependencyList = [];

    function _extractModuleTreeDependenciesFromFile(file, opts) {
        var moduleDependecies = [];

        extractModuleDependenciesFromFile(file, opts, function (_moduleDependecies) {
            dependencyList = dependencyList.concat(_moduleDependecies);
            moduleDependecies = _moduleDependecies;
        });

        moduleDependecies.forEach(function (file) {
            if (!cachedFiles[file]) {
                _extractModuleTreeDependenciesFromFile(file, opts);
                cachedFiles[file] = true;
            }
        });
    }

    _extractModuleTreeDependenciesFromFile(file, opts);

    return [].concat(_toConsumableArray(new Set(dependencyList)));
};

exports.default = function (globArr) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var saveFilePath = _path2.default.resolve(opts.saveFilePath);
    var previousContent = void 0;

    var staticValues = _globAll2.default.sync(globArr).reduce(function (dependencies, file) {
        var staticValues = extractModuleTreeDependenciesFromFile(file, opts);
        dependencies = dependencies.concat([file], staticValues);
        return dependencies;
    }, []);

    var modulesPath = _path2.default.resolve(__dirname, opts.modulesPath);

    staticValues = [].concat(_toConsumableArray(new Set(staticValues.map(function (item) {
        return item.slice(modulesPath.length + backslashLength);
    }))));

    if (_fs2.default.existsSync(saveFilePath + '/' + opts.saveFileName + '.' + opts.saveFileExt)) {
        previousContent = _fs2.default.readFileSync(saveFilePath + '/' + opts.saveFileName + '.' + opts.saveFileExt, ENCODING).toString();
    }

    var content = opts.template ? opts.template(staticValues) : JSON.stringify(staticValues);

    if (content !== previousContent) {
        _fs2.default.writeFileSync(saveFilePath + '/' + opts.saveFileName + '.' + opts.saveFileExt, content);
    }
};