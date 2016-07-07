'use strict';

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

gulp.task('default', function () {
    return gulp.src('./src/boxzilla.js')
        .pipe(webpack(webpackConfig).on('error', gutil.log))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./dist/'))
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(rename({extname: '.min.js'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/'));
});