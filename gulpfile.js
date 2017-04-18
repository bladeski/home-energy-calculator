var gulp = require('gulp'),
    nodeModulePath = './node_modules/',
    libPath = './src/public/lib/';

gulp.task('build', function () {
    var dependencies = [{
        name: 'Knockout.js',
        dir: 'knockout',
        paths: ['knockout/build/output/knockout-latest.js']
    }, {
        name: 'Bootstrap',
        dir: 'bootstrap',
        paths: ['bootstrap/dist/css/bootstrap.min*']
    }, {
        name: 'Font Awesome CSS',
        dir: 'font-awesome/css',
        paths: ['font-awesome/css/*']
    }, {
        name: 'Font Awesome Fonts',
        dir: 'font-awesome/fonts',
        paths: ['font-awesome/fonts/*']
    }];

    dependencies.forEach(function (dep) {
        dep.paths.forEach(function (path) {
            return gulp.src(nodeModulePath + path).pipe(gulp.dest(libPath + dep.dir));
        });
    });
});
