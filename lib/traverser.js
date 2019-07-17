'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _babelCore = require('babel-core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (cb) {
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

                if (_babelCore.types.isCallExpression(node) && node.callee.name === 'define') {
                    var dependencies = node.arguments[0].elements.reduce(function (result, node) {
                        var ext = node.value.endsWith('mustache') ? '' : '.js';
                        var pathModule = _path2.default.join(modulesPath, '' + node.value + ext);
                        if (_fs2.default.existsSync(pathModule)) {
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
                    var jsModule = _path2.default.join(modulesPath, moduleDir, '' + node.source.value + ext);
                    var jsIndexModule = _path2.default.join(modulesPath, moduleDir, node.source.value + '/index' + ext);

                    if (_fs2.default.existsSync(jsModule)) {
                        importDeclarationPaths = importDeclarationPaths.concat(jsModule);
                    } else if (_fs2.default.existsSync(jsIndexModule)) {
                        importDeclarationPaths = importDeclarationPaths.concat(jsIndexModule);
                    }
                }
            }
        }
    };
};