"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.extractModuleDependenciesFromFile = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var babylon = _interopRequireWildcard(require("babylon"));

var _babelTraverse = _interopRequireDefault(require("babel-traverse"));

var _globAll = _interopRequireDefault(require("glob-all"));

var _traverser = _interopRequireDefault(require("./traverser"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
    var traverser = (0, _traverser["default"])(cb, opts);
    (0, _babelTraverse["default"])(ast, traverser);
  } catch (ignore) {}
};

var extractModuleDependenciesFromFile = function extractModuleDependenciesFromFile(file) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  extractModuleDependenciesFromCode(_fs["default"].readFileSync(file, ENCODING), _objectSpread({}, opts, {
    filename: file
  }), cb);
};

exports.extractModuleDependenciesFromFile = extractModuleDependenciesFromFile;

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

  return _toConsumableArray(new Set(dependencyList));
};

var _default = function _default(globArr) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var saveFilePath = _path["default"].resolve(opts.saveFilePath);

  var previousContent;

  var staticValues = _globAll["default"].sync(globArr).reduce(function (dependencies, file) {
    var staticValues = extractModuleTreeDependenciesFromFile(file, opts);
    dependencies = dependencies.concat([file], staticValues);
    return dependencies;
  }, []);

  var modulesPath = _path["default"].resolve(__dirname, opts.modulesPath);

  staticValues = _toConsumableArray(new Set(staticValues.map(function (item) {
    return item.slice(modulesPath.length + backslashLength);
  })));

  if (_fs["default"].existsSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt))) {
    previousContent = _fs["default"].readFileSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt), ENCODING).toString();
  }

  var content = opts.template ? opts.template(staticValues) : JSON.stringify(staticValues);

  if (content !== previousContent) {
    _fs["default"].writeFileSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt), content);
  }
};

exports["default"] = _default;