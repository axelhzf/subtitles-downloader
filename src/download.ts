import path from 'path';
import fs from 'fs';
import request from 'request';
import zlib from 'zlib';

const debug = require("debug")("subtitles-downloader.download");

export function downloadGzip(url: string, outPath: string) {
  return new Promise(function (resolve, reject) {
    debug("Downloading %s", url);

    const ostream = fs.createWriteStream(outPath);
    request(url).pipe(zlib.createGunzip()).pipe(ostream);

    ostream.on("finish", function () {
      debug("Download complete %s", path.basename(outPath));
      resolve();
    });

    ostream.on("error", function () {
      debug("Download error %s -> %s", url, outPath);
      reject();
    });
  });
}
