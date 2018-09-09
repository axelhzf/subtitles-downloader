var _ = require("underscore");
var program = require("commander");
var Promise = require("bluebird");
var glob = Promise.promisify(require("glob"));
var chalk = require("chalk");
var co = require("co");
var subtitlesDownloader = require("./subtitles-downloader");

var path = require("path");

var version = require("./../package.json").version;
var utils = require("./utils");

program
  .version(version)
  .option("-f, --file <path>", "File path, or glob", "*.+(mkv|avi|mp4)")
  .option("-l, --langs <langs>", "Languages", "eng,spa")
  .option("-m, --mix", "Mix two subtitles into one")
  .option("-s, --special", "Use special characters for advanced file matching")
  .parse(process.argv);

var filePattern = program.file;
var langs = program.langs.split(",");
var mix = program.mix;
var special = program.special || false;

co(function* () {
  // if there is a provided pattern contains glob special characters, escape them
  if ((!special) && (filePattern !== '*.+(mkv|avi|mp4)')) {
    filePattern = utils.escapeGlobCharacters(filePattern);
  }

  var files = yield glob(filePattern);
  if (files.length === 0) {
    error("No matching files");
    return;
  }

  for (var file of files) {
    var options = {
      languages: langs,
      mix: mix,
      filepath: file
    };
    var results = yield subtitlesDownloader.downloadSubtitles(options);
    for (var result of results) {
      var baseFile = path.basename(file);
      if (result.path) {
        info("Downloaded - " + baseFile + " - " + result.lang);
      } else {
        warn("Not found - " + baseFile + " - " + result.lang)
      }
    }
  }
}).catch((err) => {
  error(err);
});

function error(msg) {
  console.error(chalk.red("[error]") + " - " + msg);
}

function warn(msg) {
  console.error(chalk.yellow("[warn]") + " - " + msg);
}

function info(msg) {
  console.error(chalk.green("[info]") + " - " + msg);
}
