var path = require("path");
var fs = require("fs");
var Promise = require("bluebird");
var request = require("request");
var debug = require("debug")("subtitles-downloader.download");
var zlib = require("zlib");

exports.downloadAndDecompress = function (url, subtitlePath) {
  return new Promise(function (resolve, reject) {
    debug("Downloading %s", url);

    var ostream = fs.createWriteStream(subtitlePath);
    request(url).pipe(zlib.createGunzip()).pipe(ostream);

    ostream.on("finish", function () {
      debug("Download complete %s", path.basename(subtitlePath));
      resolve();
    });

    ostream.on("error", function () {
      debug("Download error %s -> %s", url, subtitlePath);
      reject();
    });
  });
};
