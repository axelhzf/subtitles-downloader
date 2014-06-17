var path = require("path");
var zlib = require("zlib");
var request = require("request");
var fs = require("fs");
var _ = require("underscore");
var OS = require("opensubtitles");
var thunkify = require("thunkify");
var mixer = thunkify(require("subtitles-mixer"));
var utils = require("./utils");
var cfs = require("co-fs");
var parallel = require("co-parallel");

var debug = require("debug")("subtitles-downloader");

var os = new OS();
var userAgent = "OpenSubtitlesPlayer v4.7";

os.computeHash = thunkify(os.computeHash.bind(os));


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
function* downloadSubtitles (options) {
  var langs = options.languages;
  var mix = options.mix || false;
  var filepath = options.filepath;

  var reqs = langs.map(function (lang) {
    return downloadSubtitle(filepath, lang);
  });
  var subtitles = yield parallel(reqs);
  subtitles = _.map(subtitles, function (subtitle, index) {
    return {path: subtitle, lang: langs[index]}
  });

  var existingSubtitles = _.filter(subtitles, function (subtitle) {
    return subtitle.path !== undefined;
  });

  var canMix = mix && existingSubtitles.length >= 2;
  if (canMix) {
    var top = _.extend({}, existingSubtitles[0]);
    var bottom = _.extend({}, existingSubtitles[1]);
    top.encoding = encodingForLang(top.lang);
    bottom.encoding = encodingForLang(bottom.lang);

    var mixedLang = top.lang + "-" + bottom.lang;
    var mixedPath = utils.subtitlePath(filepath, mixedLang, "aas");
    yield mixer(top, bottom, mixedPath);

    subtitles.push({lang: mixedLang, path: mixedPath});
  }

  return subtitles;
}

function* downloadSubtitle (filePath, lang) {
  var subtitleUrl;
  var searchParams;
  var exists = yield cfs.exists(filePath);

  if (exists) { // using hash
    searchParams = yield searchParamsByHash(filePath, lang);
    subtitleUrl = yield searchSubtitleUrlBySearchParams(searchParams);
  }

  if (!subtitleUrl) { // using filename
    searchParams = yield searchParamsByFileName(filePath, lang);
    subtitleUrl = yield searchSubtitleUrlBySearchParams(searchParams);
  }

  if (subtitleUrl) {
    var subtitlePath = utils.subtitlePath(filePath, lang);
    yield downloadSubtitleByUrl(subtitleUrl, subtitlePath);
    return subtitlePath;
  }
}

function* searchParamsByHash(filePath, lang) {
    var hash = yield os.computeHash(filePath);
    var stat = yield cfs.stat(filePath);
    var searchParams = {
      moviehash: hash,
      moviebytesize: stat.size,
      sublanguageid: lang
    };
    return searchParams;
}

function searchParamsByFileName(filePath, lang) {
  var tag = path.basename(filePath);
  var searchParams = {
    tag: tag,
    sublanguageid: lang
  };
  return searchParams;
}

function* searchSubtitleUrlBySearchParams(searchParams) {
  var loginResponse = yield login();
  var token = loginResponse.token;
  var subtitleUrl = yield searchFirstSubtitleUrl(token, searchParams);
  return subtitleUrl;
}

function searchFirstSubtitleUrl (token, searchParams) {
  return function (cb) {
    debug("Search subtitles with searchParams %s", JSON.stringify(searchParams));
    os.api.SearchSubtitles(function (err, result) {
      if (err) return cb(err);
      var emptyResults = _.isUndefined(result.data) || result.data === false || result.data.length === 0;
      if (emptyResults) {
        debug("Search result 0");
        cb();
      } else {
        debug("Search result %d", result.data.length);
        var url = result.data[0].SubDownloadLink;
        cb(null, url);
      }
    }, token, [searchParams]);
  }
}

function downloadSubtitleByUrl (url, subtitlePath) {
  return function (cb) {
    debug("Downloading %s", url);
    var ostream = fs.createWriteStream(subtitlePath);
    request(url).pipe(zlib.createGunzip()).pipe(ostream);

    ostream.on("finish", function () {
      debug("Download complete %s", path.basename(subtitlePath));
      cb(null);
    });
  }
}

function login () {
  return function (cb) {
    os.api.LogIn(cb, "", "", "en", userAgent);
  }
}

var encodings = {
  spa: "windows-1252",
  eng: "ascii"
};

function encodingForLang (lang) {
  return encodings[lang];
}