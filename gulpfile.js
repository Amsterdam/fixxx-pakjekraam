const gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifyCSS = require('gulp-clean-css'),
    paths = {
        style: ['src/scss/**/*.scss'],
        cssMin: 'dist/public/style/',
    };

gulp.task('build', () =>
    gulp
        .src(paths.style)
        .pipe(sass())
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.cssMin)),
);

gulp.task('watch', () =>
    gulp.watch(paths.style).on('change', (path, stats) =>
        gulp
            .src(paths.style)
            .pipe(sass().on('error', sass.logError))
            .pipe(minifyCSS())
            .pipe(gulp.dest(paths.cssMin)),
    ),
);
