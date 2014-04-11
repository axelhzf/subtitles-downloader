var _ = require("underscore");
var program = require("commander");
var async = require("async");
var subtitlesDownloader = require("./subtitles-downloader");
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

function downloadSubtitlesFromGlob (pattern) {
  glob(pattern, function (err, files) {
    if (err) return logError(err);

    var fns = files.map(function (filepath) {
      var options = {
        languages: langs,
        mix: mix,
        filepath: filepath
      };
      return _.partial(subtitlesDownloader, options);
    });
    async.series(fns, function (err) {
      if (err) return logError(err);
    });

  });
}

function watchAndDownload (pattern) {
  console.log(chalk.blue("[watching]") + " - " + pattern);

  gaze(pattern, function () {

    var debouncedFns = [];

    function debouncedDownload (filepath) {
      if (!debouncedFns[filepath]) {
        debouncedFns[filepath] = _.debounce(function () {
          var options = {
            languages: langs,
            mix: mix,
            filepath: filepath
          };
          subtitlesDownloader(options, _.identity);
        }, 3000);
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