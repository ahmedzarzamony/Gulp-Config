

import gulp from 'gulp';
// Adding extra arguments for the console
import yargs from 'yargs'; 
// Compile sass files
import sass from 'gulp-sass';
// minify css
import cleanCss from 'gulp-clean-css';
// use condition inside gulp pipe
import gulpIf from 'gulp-if';
// read .scss file from the browser
//--> supported plugins: https://github.com/gulp-sourcemaps/gulp-sourcemaps/wiki/Plugins-with-gulp-sourcemaps-support
import sourcemaps from 'gulp-sourcemaps';
// compress images
import imagemin from 'gulp-imagemin';
// delete files and folders, used here for deleting dist folder
import del from 'del';
// integrate webpack with gulp
import webpack from 'webpack-stream';
// comporess javascript, exists by default with webpack production mode
//import uglify from 'gulp-uglify';
// support multiple entry point for webpack
import named from 'vinyl-named';
// browser sync
import browserSync from 'browser-sync';
// automated theme bundled
import zip from 'gulp-zip';
// replace strings in all files
import replace from 'gulp-replace';
// import package.json for replacing themename with other files
import info from './package.json';
// notifications
import notify from 'gulp-notify';
// error handler
import plumber from 'gulp-plumber';

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();

// export const hello = (done) => {
//   console.log(PRODUCTION);
//   done();
// }

// export const hello2 = (done) => {
//   console.log('hello2');
//   done();
// }

// export default hello;

const paths = {
  styles: {
    src: [
      'src/assets/scss/bundle.scss',
      'src/assets/scss/admin.scss',
    ],
    dest: 'dist/assets/css'
  },
  images: {
    src: 'src/assets/images/**/*.{jpg,jpeg,png,svg,gif}',
    dest: 'dist/assets/images'
  },
  scripts: {
    src: ['src/assets/js/bundle.js', 'src/assets/js/admin.js'],
    dest: 'dist/assets/js'
  },
  other: {
    src: [
      'src/assets/**/*',
      '!src/assets/{images,scss,js}',
      '!src/assets/{images,scss,js}/**/*'
    ],
    dest: 'dist/assets'
  },
  package: {
    src: [
      '**/*',
      '!.vscode',
      '!node_modules{,/**}',
      '!packaged{,/**}',
      '!src{,/**}',
      '!.babelrc',
      '!.gitignore',
      '!gulpfile.babel.js',
      '!package.json',
      '!package-loack.json'
    ],
    dest: 'packaged'
  }
}

export const serve = (done) => {
  server.init({
    proxy: "http://localhost:8080"
  });
  done();
}

export const reload = (done) => {
  server.reload();
  done();
}

export const styles = () => {
  //return gulp.src(['src/assets/scss/bundle.scss', 'file2', 'file3', 'file4'])
  return gulp.src(paths.styles.src)
          .pipe(gulpIf(!PRODUCTION, sourcemaps.init()))
          .pipe(sass().on('error', sass.logError))
          .pipe(gulpIf(PRODUCTION,cleanCss({compatibility: "ie8"})))
          .pipe(gulpIf(!PRODUCTION, sourcemaps.write()))
          .pipe(gulp.dest(paths.styles.dest))
          .pipe(server.stream())
}

export const images = () => {
  return gulp.src(paths.images.src)
         .pipe(gulpIf(PRODUCTION, imagemin()))
         .pipe(gulp.dest(paths.images.dest))
}

export const copy = () => {
  return gulp.src(paths.other.src)
  .pipe(gulp.dest(paths.other.dest))
  .pipe(notify('copy done'))
}

export const clean = () => {
  return del(['dist']);
}

export const watch = () => {
  //gulp.watch('src/assets/scss/**/*.scss', gulp.series(styles, reload));
  gulp.watch('src/assets/scss/**/*.scss', styles);
  gulp.watch('src/assets/js/**/*.js', gulp.series(scripts, reload));
  gulp.watch(paths.images.src, gulp.series(imagemin, reload));
  gulp.watch(paths.other.src, gulp.series(copy, reload))
  gulp.watch('**/*.php', reload)
}

export const scripts = () => {
  return gulp.src(paths.scripts.src)
         .pipe(named())
         .pipe(webpack({
          mode: (PRODUCTION) ? 'production' : 'development',
          output: {
            filename: '[name].js'
          },
          /** devtool, show components path on the console, in clase it false, all result will show under the bundle.js file */
          devtool: (PRODUCTION) ? false : 'inline-source-map' ,
          externals: {
            /* Global variables */
            jquery: 'jQuery'
          },
           module: {
            rules: [{
              test: /\.js$/,
              exclude: /node_modules/,
              use: {
                  loader: 'babel-loader'
              }
          }]
           }
         }))
         .pipe(gulp.dest(paths.scripts.dest));
}

export const compress = () => {
  del(['packaged']);
  return gulp.src(paths.package.src)
         .pipe(replace('_zizo', info.name)) // replace _zizo with "name" key form package.json file
         .pipe(zip(`${info.name}.zip`))
         .pipe(gulp.dest(paths.package.dest));
}

//export const build = gulp.series(clean, styles, images, copy); // one after one
// run clean then (styles, scripts, images, copy) at the same time
export const build = gulp.series(clean, gulp.parallel(styles, scripts, images, copy));
export const bundle = gulp.series(build, compress);
export const dev = gulp.series(clean, gulp.parallel(styles, scripts, images, copy), serve, watch);

export default build;