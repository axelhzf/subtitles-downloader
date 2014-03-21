var zlib = require("zlib");
var request = require("request");
var fs = require("fs");
var async = require("async");
var _ = require("underscore");
var OS = require("opensubtitles");
var utils = require("./utils");

var os = new OS();
var userAgent = "OpenSubtitlesPlayer v4.7";

module.exports = function subsDownloader (filePath, lang, cb) {
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

        var url = result.data[0].SubDownloadLink;
        var subtitlePath = utils.subtitlePath(filePath, lang);
        downloadSubtitle(url, subtitlePath, cb);
      });
    });
  });
};

function downloadSubtitle (url, subtitlePath, cb) {
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