var _ = require("underscore");
var program = require("commander");
var async = require("async");
var mixer = require("subtitles-mixer");
var subtitlesDownloader = require("./subtitles-downloader");
var utils = require("./utils");
var glob = require("glob");
var chalk = require("chalk");
var gaze = require("gaze");

var version = require("./../package.json").version;
program
  .version(version)
  .option("-f, --file <path>", "File path, or glob", "*.+(mkv|avi|mp4)")
  .option("-l, --langs <langs>", "Languages", "eng,spa")
  .option("-m, --mix", "Mix two subtitles into one")
  .option("-w, --watch", "Watch for files changes to automatically downloads")
  .parse(process.argv);

var filePattern = program.file;
var langs = program.langs.split(",");
var mix = program.mix;
var watch = program.watch;

if (watch) {
  watchAndDownload(filePattern);
} else {
  downloadSubtitlesFromGlob(filePattern);
}

function downloadSubtitlesFromGlob(pattern) {
  glob(pattern, function (err, files) {
    if (err) return logError(err);

    var downloadFn = _.partial(downloadSubtitles, langs, mix);
    async.mapSeries(files, downloadFn, function (err) {
      if (err) return logError(err);
    });
  });
}

function downloadSubtitles (langs, mix, file, cb) {
  var downloadFn = _.partial(downloadSubtitle, file);
  async.mapSeries(langs, downloadFn, function (err, result) {
    var doMix = (mix && langs.length >= 2);
    if (!doMix) {
      return cb(err);
    }
    var mixedPath = utils.subtitlePath(file, langs[0] + "-" + langs[1]);
    mixer(result[0], result[1], mixedPath, function (err) {
      if (!err) {
        logMix(mixedPath, [langs[0], langs[1]]);
      }
      cb(err);
    });
  });
}

function downloadSubtitle (file, lang, cb) {
  subtitlesDownloader(file, lang, function (err, dest) {
    if (err) {
      logError(err);
    } else {
      logDownload(dest, lang);
    }
    cb(null, dest); //continue on error
  });
}

function watchAndDownload(pattern) {
  console.log(chalk.blue("[watching]") + " - " + pattern);

  gaze(pattern, function () {

    var debouncedFns = [];
    function debouncedDownload(filepath) {
      if(!debouncedFns[filepath]) {
        debouncedFns[filepath] = _.debounce(function () {
          downloadSubtitles(langs, mix, filepath, _.identity);
        });
      }
      debouncedFns[filepath]();
    }

    this.on('changed', debouncedDownload);
    this.on('added', debouncedDownload);

  });
}

function logError (err) {
  console.error(chalk.red("[error]") + " - " + err);
}

function logDownload (file, lang) {
  console.log(chalk.green("[downloaded]") + " - "+ chalk.blue("[" + lang +"]") +" - " + file);
}

function logMix (file, langs) {
  var langStr = langs.join(" - ");
  console.log(chalk.green("[mixed]") + " - "+ chalk.blue("[" + langStr +"]") +" - " + file);
}