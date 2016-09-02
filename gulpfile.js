const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const filter = require('gulp-filter');
const del = require('del');
const merge = require('merge-stream');
const jsonminify = require('gulp-jsonminify');
const jsonMinify = require('gulp-json-minify');
const uglify = require('gulp-uglify');
const zip = require('gulp-zip');
const closureCompiler = require('google-closure-compiler').gulp();


gulp.task('default',['build'], function() {
    // place code for your default task here
});

gulp.task('build',['build.clean'], function() {
    console.log('build');
    const zipFilter = filter(['**/*', '!**/*.zip']);

    return merge(mainStream,libStream,manifestStream,jsStream)
        .pipe(zipFilter)
        //.pipe(zip('build.zip',{compress:true}))
        .pipe(gulp.dest('build/'));
    //return gulp.src('./src/js/**/*.js')
     //   .pipe(gulp.dest('./dist/'));
});

gulp.task('build.clean', function () {
    return del([
        './build/**/*',
        //'dist/report.csv',
        // here we use a globbing pattern to match everything inside the `mobile` folder
        //'dist/mobile/**/*',
        // we don't want to clean this file though so we negate the pattern
        //'!dist/mobile/deploy.json'
    ]);
});

gulp.task('build.manifestStream',['build.clean'], function () {
    return gulp.src(['src/**/manifest.json','src/**/messages.json'], { base: "./src/" })
        //.pipe(jsonminify())// error
        .pipe(jsonMinify())
        .pipe(gulp.dest('build/'));
        //.on('error', util.log);//https://www.npmjs.com/package/gulp-json-minify
});

gulp.task('build.libStream',['build.clean'], function () { // OK
    const minFilter = filter(['**/*.min.*','**/*.woff2']);
    return gulp.src(['src/lib/**/*'], { base: "./src/" })
        .pipe(filter(['**/*','!src/lib/highcharts/**/*','!src/lib/highcharts']))
        .pipe(minFilter)
        .pipe(gulp.dest('build/'));
});

gulp.task('build.highStockLibStream',['build.clean'], function () { // OK
    const hsFilter = filter(['**/highstock.js','**/exporting.js']);
    return gulp.src(['src/lib/highcharts/**/*'], { base: "./src/" })
        .pipe(hsFilter)
        .pipe(gulp.dest('build/'));
});

gulp.task('build.jsStream',['build.clean'], function () { // OK

    return gulp.src(['src/class/**/*.js','src/browser_action/**/*.js','src/bg/**/*.js'], { base: "./src/" })
        .pipe(sourcemaps.init())
        //*
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify({
            preserveComments: 'license'
        }).on('error', function(e){
            console.log(e);
        }))//*/
        /*.pipe(closureCompiler({
         compilation_level: 'SIMPLE',
         //warning_level: 'VERBOSE',
         language_in: 'ECMASCRIPT6_STRICT',
         //language_out: 'ECMASCRIPT5_STRICT',
         //output_wrapper: '(function(){\n%output%\n}).call(this)',
         //js_output_file: 'output.min.js'
         }))//*/
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build/'));
    //.pipe(zipFilter)
    //.pipe(gulp.dest('./build/lib/'));
});

gulp.task('build.mainStream',['build.clean'], function () { // OK
    return gulp.src(['src/**/*'], { base: "./src/" })
        .pipe(filter(['**/*','!**/*.json']))
        .pipe(filter(['**/*','!**/*.js']))
        .pipe(filter(['**/*','!**/*_.png']))
        .pipe(filter(['**/*','!src/lib/**/*','!src/lib']))
        .pipe(gulp.dest('build/'));
    //.pipe(stripJsonComments());
    //.pipe(zipFilter)
    //.pipe(filter(['src/**/*']))
    //.pipe(gulp.dest('build/'));

});

gulp.task('build.packageAll',[
    'build.mainStream',
    'build.manifestStream',
    'build.libStream',
    'build.highStockLibStream',
    'build.jsStream'
], function (_done) { // OK
    return gulp.src(['build/**/*'], { base: "./build/" })
        .pipe(zip('build.zip',{compress:true}))
        .pipe(gulp.dest('build/'));
    //console.log('All Done')
    //_done();
});