'use strict';
const babel = require('babel-core');

module.exports = {
  process: (src, filename) => {
    // Ignore all files within node_modules
    // babel files can be .js, .es, .jsx or .es6
    if (filename.indexOf('node_modules') === -1 && babel.util.canCompile(filename)) {
      src = babel.transform(src, {
        filename: filename,
        retainLines: true,
        presets: ['es2015', 'stage-0'],
        plugins: [
          'transform-runtime',
          'transform-class-properties',
          'transform-es2015-object-super',
          ['transform-es2015-classes', {loose: true}]
        ]
      }).code;
      // console.log(src);
    }
    return src;
  }
};
