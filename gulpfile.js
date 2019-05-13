const gulp = require('gulp'),
      // concat = require('gulp-concat'),
      sass = require('gulp-sass'),
      // autoprefixer = require('gulp-autoprefixer'),
      minifyCSS = require('gulp-clean-css'),
      paths = {
        style: [
            'src/scss/**/*.scss'
        ],
        fonts: [
          'fonts/*'
        ],
        cssMin: 'css/min/'
      };
//
gulp.task('compileSass', () => {
  gulp.src(paths.style)
    .pipe(sass())
    // .pipe(autoprefixer('last 2 version'))
    // .pipe(concat('screen.css'))
    // .pipe(minifyCSS())
    .pipe(gulp.dest('css'));
});


gulp.task('default', function(){
    gulp.watch('src/scss/**/*.scss')
    .on('change', function(path, stats) {
        return gulp.src(paths.style)
            .pipe(sass())
            .pipe(gulp.dest('src/public/css'));
    });
});

gulp.task('watch', function(){
    gulp.watch('src/scss/**/*.scss')
    .on('change', function(path, stats) {
        // return gulp.task('compileSass');
        return gulp.src(paths.style)
            .pipe(sass())
            .pipe(minifyCSS())
            .pipe(gulp.dest('src/public/style'));

    });
});
