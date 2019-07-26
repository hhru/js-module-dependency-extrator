"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _core = require("@babel/core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = function _default(cb) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var modulesPath = opts.modulesPath,
      filename = opts.filename;
  var importDeclarationPaths = [];
  return {
    Program: {
      exit: function exit() {
        cb(importDeclarationPaths);
      }
    },
    CallExpression: {
      enter: function enter(_ref) {
        var node = _ref.node;

        if (_core.types.isCallExpression(node) && node.callee.name === 'define') {
          var dependencies = node.arguments[0].elements.reduce(function (result, node) {
            var ext = node.value.endsWith('mustache') ? '' : '.js';

            var pathModule = _path["default"].join(modulesPath, "".concat(node.value).concat(ext));

            if (_fs["default"].existsSync(pathModule)) {
              result.push(pathModule);
            }

            return result;
          }, []);
          importDeclarationPaths = importDeclarationPaths.concat(dependencies);
        }
      }
    },
    ImportDeclaration: {
      enter: function enter(_ref2) {
        var node = _ref2.node;

        if (node && node.source && node.source.value) {
          var moduleDir = node.source.value[0] === '.' ? filename.slice(modulesPath.length, filename.lastIndexOf('/')) : '';
          var ext = node.source.value.endsWith('mustache') ? '' : '.js';

          var jsModule = _path["default"].join(modulesPath, moduleDir, "".concat(node.source.value).concat(ext));

          var jsIndexModule = _path["default"].join(modulesPath, moduleDir, "".concat(node.source.value, "/index").concat(ext));

          if (_fs["default"].existsSync(jsModule)) {
            importDeclarationPaths = importDeclarationPaths.concat(jsModule);
          } else if (_fs["default"].existsSync(jsIndexModule)) {
            importDeclarationPaths = importDeclarationPaths.concat(jsIndexModule);
          }
        }
      }
    }
  };
};

exports["default"] = _default;