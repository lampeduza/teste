const {src, dest, watch, series} = require("gulp");
const pug = require("gulp-pug");
const plumber = require("gulp-plumber");
const cached = require("gulp-cached");
const sourcemap = require("gulp-sourcemaps");
const csso = require("gulp-csso");
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const rename = require("gulp-rename");
const server = require("browser-sync").create();
const del = require("del");
const svgstore = require("gulp-svgstore");
const imagemin = require("gulp-imagemin");
const webp = require('gulp-webp');
const sass = require('gulp-sass')(require('sass'));

const ghPages = require('gh-pages');
const path = require('path');

function deploy(cb) {
  ghPages.publish(path.join(process.cwd(), './dist'), cb);
}

function html() {
	return src("src/pug/pages/*.pug")
		.pipe(plumber())
		.pipe(pug({pretty: true}))
		.pipe(cached("pug"))
		.pipe(dest("dist/"))
    .pipe(server.reload({
      stream: true
    }));
}

function css() {
	return src("src/sass/styles.scss")
		.pipe(plumber())
		.pipe(sourcemap.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([autoprefixer({
  	  grid: true,
  	})]))
  	.pipe(dest("dist/css"))
		.pipe(csso())
		.pipe(rename("styles.min.css"))
		.pipe(sourcemap.write('.'))
		.pipe(dest("dist/css"))
		.pipe(server.reload({
      stream: true
    }));
}

function js() {
	return src(["src/js/main.js", "src/js/ui-kit/ui-kit.js"])
		.pipe(dest("dist/js"));
}

function svgo() {
  return src("src/img/**/*.{svg}")
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeRasterImages: true},
          {removeUselessStrokeAndFill: false},
        ]
      }),
    ]))
    .pipe(dest("src/img"));
}

function sprite() {
  return src("src/img/**/*.svg")
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename("sprite.svg"))
    .pipe(dest("dist/img"));
}

function copySvg() {
  return src("src/img/**/*.svg", {base: "src"})
    .pipe(dest("dist"));
}

function copyImages() {
  return src('src/img/**/*.{png, jpg, webp}', {base: 'src'})
   	.pipe(dest('build'));
}

function optimizeImages() {
  return src('dist/img/**/*.{png,jpg}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
    ]))
    .pipe(dest('dist/img'));
}

function createWebp() {
  const root = '';
  return src(`src/img/${root}**/*.{png,jpg}`)
    .pipe(webp({quality: 80}))
    .pipe(dest(`src/img/${root}`));
};


function refresh(done) {
  server.reload();
	done();
}

function syncServer() {
  server.init({
    server: {
      baseDir: 'dist'
    },
    index: 'sitemap.html',
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

	watch("src/sass/**/*.scss", series(css, refresh));
	watch("src/pug/**/*.pug", series(html, refresh));
	watch("src/js/**/*.{js, json}", series(js, refresh));
	watch("src/img/**/*.svg", series(copySvg, sprite, html, refresh));
	watch("src/img/**/*.{png, jpg, webp}", series(copyImages, html, refresh));
}

function clean() {
	return del("dist");
}

function copy() {
  return src([
    'src/fonts/**',
    'src/img/**',
  ], {
    base: 'src',
  })
  .pipe(dest('dist'));
}

const start = series(clean, svgo, copy, css, sprite, js, html, syncServer);
const build = series(clean, svgo, copy, css, sprite, js, html, optimizeImages);

exports.imagemin = optimizeImages;
exports.webp = createWebp;
exports.start = start;
exports.build = build;
exports.deploy = deploy;