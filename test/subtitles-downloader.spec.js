var subtitlesDownloader = require("../src/subtitles-downloader");
var expect = require("chai").expect;
var sinon = require("sinon");
var path = require("path");
var fs = require("mz/fs");
var tmp = require("tmp");
var _ = require("underscore");
require("co-mocha");
var Promise = require("bluebird");
var tmpDir = Promise.promisify(tmp.dir);
var download = require("../src/download");

var DOWNLOAD_URL = "http://download";
var TOKEN = "token";

var filename = "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4";
var filePath;

describe("subtitles-downloader", function () {
  var testDir;
  var sandbox;
  var loginMock;

  beforeEach(function* () {
    sandbox = sinon.sandbox.create();
    testDir = yield tmpDir();
    filePath = path.join(testDir, filename);

    sandbox.stub(subtitlesDownloader.os.api, "LogIn", function (cb) {
      cb(null, {token: TOKEN});
    });

    sandbox.stub(download, "downloadAndDecompress", function* (url, path) {
      expect(url).to.eql(DOWNLOAD_URL);
      var f = yield fs.open(path, "w");
      yield fs.close(f);
    });

  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("downloadSubtitle", function () {
    it("should download a subtitle if the file exists", function* () {
      var filePath = path.join(testDir, filename);

      stubFindByHash();

      var destinationFile = yield subtitlesDownloader.downloadSubtitle(filePath, "spa");
      var expectedDestination = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt");
      expect(destinationFile).equals(expectedDestination);
      sandbox.restore();

      var fileExists = yield fs.exists(destinationFile);
      expect(fileExists).to.be.true;
    });

    it("should download a subtitle if the file doesn't exists", function* () {
      var filePath = path.join(testDir, filename);
      var lang = "spa";

      stubFindByTag();

      yield subtitlesDownloader.downloadSubtitle(filePath, lang);
      sandbox.restore();

      var fileExists = yield fs.exists(path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt"));
      expect(fileExists).to.be.true;
    });

    it("should throw an error an error if the subtitle doesn't exists", function* () {
      var filePath = path.join(testDir, filename);
      var lang = "spa";

      stubFindByTag();

      yield subtitlesDownloader.downloadSubtitle(filePath, lang);
      sandbox.restore();

      var fileExists = yield fs.exists(path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt"));
      expect(fileExists).to.be.true;

    })

  });

  describe("downloadSubtitles", function () {

    beforeEach(function () {
      stubFindByTag();
    });

    it("should download a subtitle in multiple languages", function* () {
      var filename = "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4";
      var filePath = path.join(testDir, filename);

      var result = yield subtitlesDownloader.downloadSubtitles({filepath: filePath, languages: ["spa", "eng"]});
      sandbox.restore();

      var expectedResult = [
        {lang: "spa", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt")},
        {lang: "eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.eng.srt")}
      ];
      expect(result).to.eql(expectedResult);
      yield assertAllFilesExists(_.pluck(expectedResult, "path"));
    });

    it("should mix subtitles", function* () {

      var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
      var result = yield subtitlesDownloader.downloadSubtitles({
        filepath: filePath,
        languages: ["spa", "eng"],
        mix: true
      });
      var expectedResult = [
        {lang: "spa", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt")},
        {lang: "eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.eng.srt")},
        {lang: "spa-eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa-eng.aas")}
      ];
      sandbox.restore();

      expect(result).to.eql(expectedResult);
      yield assertAllFilesExists(_.pluck(expectedResult, "path"));
    });
  });

  function stubFindByTag() {
    sandbox.stub(subtitlesDownloader.os.api, "SearchSubtitles", function (cb, token, searchParams) {
      expect(token).to.eql(TOKEN);
      expect(searchParams[0].tag).to.eql(filename);
      expect(searchParams[0].sublanguageid == "spa" || searchParams[0].sublanguageid == "eng");
      var response = {
        data: [{SubDownloadLink: DOWNLOAD_URL}]
      };
      cb(null, response);
    });
  }

  function stubFindByHash() {
    var lang = "spa";
    var size = 225351574;
    var hash = "a1cb1a4680490e53";

    sandbox.stub(fs, "exists", function () {
      return function (cb) {
        return cb(null, true);
      }
    });

    sandbox.stub(fs, "stat", function () {
      return function (cb) {
        cb(null, {size: size});
      }
    });

    sandbox.stub(subtitlesDownloader.os, "computeHash", function (_filePath) {
      return function (cb) {
        expect(filePath).to.equal(_filePath);
        cb(null, hash);
      }
    });

    sandbox.stub(subtitlesDownloader.os.api, "SearchSubtitles", function (cb, token, searchParams) {
      expect(token).to.eql(TOKEN);
      expect(searchParams[0]).to.eql({
        moviehash: hash,
        moviebytesize: size,
        sublanguageid: lang
      });
      var response = {
        data: [{SubDownloadLink: DOWNLOAD_URL}]
      };
      cb(null, response);
    });
  }

  function* assertAllFilesExists(files) {
    for (var i = 0; i < files.length; i++) {
      var exists = yield fs.exists(files[i]);
      expect(exists).to.be.true;
    }
  }

});