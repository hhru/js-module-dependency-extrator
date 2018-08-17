import fs from 'fs';
import nodePath from 'path';
import { types } from 'babel-core';

export default (cb, opts = {}) => {
    const { modulesPath } = opts;
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
                        const pathModule = nodePath.join(modulesPath, `${node.value}.js`);
                        if (fs.existsSync(pathModule)) {
                            result.push(pathModule);
                        }

                        return result;
                    }, []);

                    importDeclarationPaths = importDeclarationPaths.concat(dependencies);
                }
            },
        },
    };
};
