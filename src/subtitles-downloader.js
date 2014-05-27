var path = require("path");
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

module.exports = {
  downloadSubtitles: downloadSubtitles,
  downloadSubtitle: downloadSubtitle,
  os: os
};


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
      return cb(err, result);
    }
    var top = {path: result[0], lang: langs[0], encoding: encodingForLang(langs[0])};
    var bottom = {path: result[1], lang: langs[1], encoding: encodingForLang(langs[1])};
    var mixedPath = utils.subtitlePath(filepath, top.lang + "-" + bottom.lang, "ass");
    mixer(top, bottom, mixedPath, function (err) {
      if (!err) {
        logMix(mixedPath, [top.lang, bottom.lang]);
        return cb(err);
      }
      result.push(mixedPath);
      cb(err, result);
    });

  });
}

function downloadSubtitleIgnoreErrors (filepath, lang, cb) {
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
  searchParams(filePath, function (err, params) {
    if (err) return cb(err);
    params.sublanguageid = lang;
    login(function (err, res) {
      if (err) return cb(err);
      var token = res.token;
      searchSubtitles(token, [params], function (err, result) {
        if (err) return cb(err);
        if  (result.length === 0) return cb();

        var url = result[0].SubDownloadLink;
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

function searchParams (filePath, cb) {
  fs.stat(filePath, function (err, stat) {
    if (err) {
      if (err.code !== "ENOENT") return cb(err);
      var tag = path.basename(filePath);
      var searchParams = {
        tag: tag
      };
      cb(null, searchParams);
    } else {
      os.computeHash(filePath, function (err, hash) {
        if (err) return cb(err);
        var searchParams = {
          moviehash: hash,
          moviebytesize: stat.size
        };
        cb(null, searchParams);
      });
    }
  });
}

function login (cb) {
  os.api.LogIn(cb, "", "", "en", userAgent);
}

function searchSubtitles (token, params, cb) {
  os.api.SearchSubtitles(function (err, result) {
    if (err) return cb(err);
    if (_.isUndefined(result.data) || result.data === false) return cb(new Error({code: "NOTFOUND"}));
    cb(null, result.data);
  }, token, params);
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