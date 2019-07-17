import fs from 'fs';
import nodePath from 'path';
import { types } from '@babel/core';

export default (cb, opts = {}) => {
    const { modulesPath, filename } = opts;
    let importDeclarationPaths = [];
    return {
        Program: {
            exit() {
                cb(importDeclarationPaths);
            },
        },

        CallExpression: {
            enter({ node }) {
                if (types.isCallExpression(node) && node.callee.name === 'define') {
                    const dependencies = node.arguments[0].elements.reduce((result, node) => {
                        const ext = node.value.endsWith('mustache') ? '' : '.js';
                        const pathModule = nodePath.join(modulesPath, `${node.value}${ext}`);
                        if (fs.existsSync(pathModule)) {
                            result.push(pathModule);
                        }

                        return result;
                    }, []);

                    importDeclarationPaths = importDeclarationPaths.concat(dependencies);
                }
            },
        },

        ImportDeclaration: {
            enter({ node }) {
                if (node && node.source && node.source.value) {
                    const moduleDir =
                        node.source.value[0] === '.'
                            ? filename.slice(modulesPath.length, filename.lastIndexOf('/'))
                            : '';
                    const ext = node.source.value.endsWith('mustache') ? '' : '.js';
                    const jsModule = nodePath.join(modulesPath, moduleDir, `${node.source.value}${ext}`);
                    const jsIndexModule = nodePath.join(modulesPath, moduleDir, `${node.source.value}/index${ext}`);

                    if (fs.existsSync(jsModule)) {
                        importDeclarationPaths = importDeclarationPaths.concat(jsModule);
                    } else if (fs.existsSync(jsIndexModule)) {
                        importDeclarationPaths = importDeclarationPaths.concat(jsIndexModule);
                    }
                }
            },
        },
    };
};
