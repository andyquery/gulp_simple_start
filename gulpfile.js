import pkg from 'gulp';
const { src, dest, parallel, series, watch } = pkg;

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import sourceMaps from 'gulp-sourcemaps';
import postCss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import rename from 'gulp-rename';
import concat from 'gulp-concat';
import imagemin from 'gulp-imagemin';
import browserSync from 'browser-sync';
import { deleteAsync } from 'del';
import babel from 'gulp-babel';
import gulpTerser from 'gulp-terser';
import fileInclude from 'gulp-file-include';
import htmlmin from 'gulp-htmlmin';
import newer from 'gulp-newer';

function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'src/',
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
	})
};

function html() {
	return src('src/html/*.html')
		.pipe(fileInclude({
			prefix: '@',
			basepath: "@file"
		}))
		.pipe(dest('src/'))
		.pipe(browserSync.stream())
};

function style() {
	return src('src/style/**/*.scss')
		.pipe(sourceMaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(postCss([
			autoprefixer({
				cascade: false,
				grid: true,
				overrideBrowserslist: ["last 5 versions"]
			}),
			cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
		]))
		.pipe(rename({ suffix: '.min', prefix: '' }))
		.pipe(sourceMaps.write('.'))
		.pipe(dest('src/css'))
		.pipe(browserSync.stream())
};

function js() {
	return src('src/js/app.js')
		.pipe(sourceMaps.init())
		.pipe(concat('main.min.js'))
		.pipe(babel(
			{
				presets: ['@babel/preset-env']
			}
		))
		.pipe(gulpTerser())
		.pipe(sourceMaps.write('.'))
		.pipe(dest('src/js'))
		.pipe(browserSync.stream())
};

function vendorJs(){
	return src([
		'node_modules/swiper/swiper-bundle.js',
		'node_modules/gsap/dist/gsap.js',
		'node_modules/gsap/dist/ScrollTrigger.js'
		])
		.pipe(sourceMaps.init())
		.pipe(concat('vendor.min.js'))
		.pipe(babel(
			{
				presets: ['@babel/preset-env']
			}
		))
		.pipe(gulpTerser())
		.pipe(sourceMaps.write('.'))
		.pipe(dest('src/js/vendor'))
		.pipe(browserSync.stream())
}

function img() {
	return src(['src/img/**/*'])
		.pipe(imagemin())
		.pipe(dest('dist/img/'))
};

async function removedist() { await deleteAsync('dist/**/*', { force: true }) };

function htmlBuild() {
  return src('src/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'))
};

function buildCopy() {
	return src([
		'{src/js/**,src/css}/*.min.*',
		'src/fonts/**/*'
	], { base: 'src/' })
	.pipe(dest('dist'))
};

function watcher() {
	watch(['src/*.html'], { usePolling: true }).on('change', browserSync.reload)
	watch('src/html/**/*.html', html)
	watch('src/style/**/*.scss', style)
	watch('src/js/app.js', js)
};

export { html, htmlBuild, style, js, vendorJs, img, removedist }

export let build = series(removedist, htmlBuild, img, js, vendorJs, style, buildCopy)

export default series(html, style, js, vendorJs, parallel(browsersync, watcher))