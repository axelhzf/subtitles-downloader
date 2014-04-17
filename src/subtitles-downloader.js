var zlib = require("zlib");
var request = require("request");
var fs = require("fs");
var async = require("async");
var _ = require("underscore");
var OS = require("opensubtitles");
var chalk = require("chalk");
var mixer = require("subtitles-mixer");
var utils = require("./utils");

var os = new OS();
var userAgent = "OpenSubtitlesPlayer v4.7";

/**
 * @param options.filepath
 * @param options.languages
 * @param options.mix
 */
function downloadSubtitles (options, cb) {
  var langs = options.languages;
  var mix = options.mix || false;
  var filepath = options.filepath;
  
  var downloadFn = _.partial(downloadSubtitleIgnoreErrors, filepath);
  async.mapSeries(langs, downloadFn, function (err, result) {
    var doMix = (mix && langs.length >= 2 && result[0] && result[1]);
    if (!doMix) {
      return cb(err);
    }
    var top = {path: result[0], lang: langs[0], encoding: encodingForLang(langs[0])};
    var bottom = {path: result[1], lang: langs[1], encoding: encodingForLang(langs[1])};
    var mixedPath = utils.subtitlePath(filepath, top.lang + "-" + bottom.lang, "ass");
    mixer(top, bottom, mixedPath, function (err) {
      if (!err) {
        logMix(mixedPath, [top.lang, bottom.lang]);
      }
      cb(err);
    });
    
  });
}

function downloadSubtitleIgnoreErrors(filepath, lang, cb) {
  downloadSubtitle(filepath, lang, function (err, dest) {
    if (err) {
      logError(err);
    } else {
      logDownload(filepath, lang);
    }
    cb(null, dest); //ignore error
  })
}

function downloadSubtitle (filePath, lang, cb) {
  fileInfo(filePath, function (err, fileInfo) {
    if (err) return cb(err);

    login(function (err, res) {
      if (err) return cb(err);

      var token = res.token;
      var searchParams = [
        {
          moviehash: fileInfo.hash,
          moviebytesize: fileInfo.stats.size,
          sublanguageid: lang
        }
      ];
      searchSubtitles(token, searchParams, function (err, result) {
        if (err) return cb(err);
        if (result.data === false) return cb("Not found - " + lang + " - " + filePath);
        if (_.isUndefined(result.data)) return cb("Not found - " + lang + " - " + filePath);

        var url = result.data[0].SubDownloadLink;
        var subtitlePath = utils.subtitlePath(filePath, lang);
        doRequest(url, subtitlePath, cb);
      });
    });

  });
}

function doRequest (url, subtitlePath, cb) {
  var ostream = fs.createWriteStream(subtitlePath);
  request(url)
    .pipe(zlib.createGunzip())
    .pipe(ostream);
  ostream.on("finish", function () {
    cb(null, subtitlePath);
  });
}

function fileInfo (filePath, cb) {
  var computeHash = _.bind(os.computeHash, os, filePath);
  var stats = _.bind(fs.stat, fs, filePath);
  async.parallel({hash: computeHash, stats: stats}, cb);
}

function login (cb) {
  os.api.LogIn(cb, "", "", "en", userAgent);
}

function searchSubtitles (token, params, cb) {
  os.api.SearchSubtitles(cb, token, params);
}

function encodingForLang (lang) {
  if (lang === "spa") {
    return "windows-1252";
  } else if (lang === "eng") {
    return "ascii";
  }
}

function logError (err) {
  console.error(chalk.red("[error]") + " - " + err);
}

function logDownload (file, lang) {
  console.log(chalk.green("[downloaded]") + " - " + chalk.blue("[" + lang + "]") + " - " + file);
}

function logMix (file, langs) {
  var langStr = langs.join(" - ");
  console.log(chalk.green("[mixed]") + " - " + chalk.blue("[" + langStr + "]") + " - " + file);
}

exports.downloadSubtitles = downloadSubtitles;
exports.downloadSubtitle = downloadSubtitle;