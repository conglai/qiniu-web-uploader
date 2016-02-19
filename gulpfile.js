'use strict';
const eslintrc = {
  'parser': 'babel-eslint',
  'ecmaFeatures': {
    'blockBindings': true,
    'forOf': true,
    'jsx': true,
    'classes': true,
    'modules': true
  },
  'env':{
    'es6': true
  },
  'rules': {
    'semi': 2,
    'quotes': [1, 'single'],//只能使用单引号
    'no-eval': 1,//禁止使用eval
    'no-multi-str': 2,//字符串不能用\换行
    'no-new-func': 1,//禁止使用new Function
    'no-new-object': 2,//禁止使用new Object()
    'no-new-require': 2,//禁止使用new require
    'no-redeclare': 2,//禁止重复声明变量
    'no-unreachable': 2,//不能有无法执行的代码
    'no-with': 2,//禁用with
    'default-case': 2,//switch语句最后必须有default
    'eqeqeq': 2,//必须使用全等
    'require-yield': 0,//生成器函数必须有yield
    'indent':  [2, 2, {'SwitchCase': 1}],//缩进风格
    'no-alert': 0,//禁止使用alert confirm prompt
    'camelcase': [2, { 'properties': 'never' }]
  }
};
const babelrc = {
  presets: ['es2015', 'stage-0'],
  plugins: [
    'transform-runtime',
    'transform-class-properties',
    'transform-es2015-object-super',
    ['transform-es2015-classes', {loose: true}]
  ]
};

const mochaConfig = {
  reporter: 'spec',
  timeout: 1000,
  globals: {
    should: require('should'),
    env: require('./test-env')
  }
};
require('should-sinon');

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const mocha = require('gulp-mocha');
const gutil = require('gulp-util');
const eslintSrc = [
  'src/*.js',
  'tests/*.js'
];
const ROOT = __dirname;
gulp.task('tests', ['build'], () => {
  return gulp.src('tests/*.js')
    .pipe(mocha(mochaConfig))
    .on('error', gutil.log);
});
gulp.task('build', () => {
  return gulp.src('src/*.js')
    .pipe(eslint(eslintrc))
    .pipe(eslint.format())
    .pipe(babel(babelrc))
    .pipe(gulp.dest('lib'));
});

gulp.task('default', ['tests'], () => {

  gulp.watch(eslintSrc, event => {
    let path = event.path.replace(ROOT + '/', '');
    gutil.log(path + ' is changed.');
    if(path.indexOf('tests') !== -1) {
      gulp.src(path)
        .pipe(mocha(mochaConfig))
        .on('error', gutil.log);
    } else {
      let testPath = path.replace('src','tests');
      gulp.src(path)
        .pipe(eslint(eslintrc))
        .pipe(eslint.format())
        .pipe(babel(babelrc))
        .pipe(gulp.dest('lib'))
        .on('end', () => {
          gulp.src(testPath)
            .pipe(mocha(mochaConfig))
            .on('error', gutil.log);
        });
    }

  });
});

