var subtitlesDownloader = require("../src/subtitles-downloader");
var expect = require("chai").expect;
var sinon = require("sinon");
var path = require("path");
var co = require("co");
var thunkify = require("thunkify");
var cfs = require("co-fs");
var fs = require("fs");
var tmp = require("tmp");
var _ = require("underscore");

var tmpDir = thunkify(tmp.dir);

describe("subtitles-downloader", function () {
  var testDir;
  var sandbox;

  beforeEach(function (done) {
    sandbox = sinon.sandbox.create();
    co(function* () {
      testDir = yield tmpDir();
    })(done);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("downloadSubtitle", function () {
    it("should download a subtitle if the file exists", function (done) {
      co(function* () {
        var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
        var lang = "spa";

        prepareStubs(filePath, 225351574, "a1cb1a4680490e53");
        var destinationFile = yield subtitlesDownloader.downloadSubtitle(filePath, lang);
        var expectedDestination = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt");
        expect(destinationFile).equals(expectedDestination);
        var fileExists = yield cfs.exists(destinationFile);
        expect(fileExists).to.be.true;

      })(done);
    });

    it("should download a subtitle if the file doesn't exists", function (done) {
      co(function* () {
        var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
        var lang = "spa";
        yield subtitlesDownloader.downloadSubtitle(filePath, lang);
        var fileExists = yield cfs.exists(path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt"));
        expect(fileExists).to.be.true;
      })(done);
    });

  });

  describe("downloadSubtitles", function () {
    it("should download a subtitle in multiple languages", function (done) {
      co(function* () {
        var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
        var result = yield subtitlesDownloader.downloadSubtitles({filepath: filePath, languages: ["spa", "eng"]});
        var expectedResult = [
          {lang: "spa", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt")},
          {lang: "eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.eng.srt")}
        ];
        expect(result).to.eql(expectedResult);
        var fileExists = yield _.pluck(expectedResult, "path").map(cfs.exists);
        expect(_.every(fileExists)).to.be.true;
      })(done);
    });

    it("should mix subtitles", function (done) {
      co(function* () {
        var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
        var result = yield subtitlesDownloader.downloadSubtitles({filepath: filePath, languages: ["spa", "eng"], mix: true});
        var expectedResult = [
          {lang: "spa", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt")},
          {lang: "eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.eng.srt")},
          {lang: "spa-eng", path: path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa-eng.aas")}
        ];

        expect(result).to.eql(expectedResult);
        var fileExists = yield _.pluck(expectedResult, "path").map(cfs.exists);
        expect(_.every(fileExists)).to.be.true;
      })(done);
    });
  });

  function prepareStubs (filePath, size, hash) {
    sandbox.stub(cfs, "exists", function () {
      return function (cb) {
        return cb(null, true);
      }
    });
    sandbox.stub(fs, "stat", function (_filePath, cb) {
      cb(null, {size: size});
    });
    sandbox.stub(cfs, "stat", function (_filePath) {
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
  }

});