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

["downloadSubtitle", "downloadSubtitles"].forEach(function (fun) {
  subtitlesDownloader[fun] = thunkify(subtitlesDownloader[fun]);
});

describe("subtitles-downloader", function () {
  var testDir;

  beforeEach(function (done) {
    co(function* () {
      testDir = yield tmpDir();
    })(done);
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

        restoreStubs();
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
          path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt"),
          path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.eng.srt")
        ];
        expect(result).to.eql(expectedResult);
        var fileExists = yield expectedResult.map(cfs.exists);
        expect(_.every(fileExists)).to.be.true;
      })(done);
    });
  });

  function prepareStubs (filePath, size, hash) {
    sinon.stub(fs, "stat", function (_filePath, cb) {
      cb(null, {size: size});
    });
    sinon.stub(subtitlesDownloader.os, "computeHash", function (_filePath, cb) {
      expect(filePath).to.equal(_filePath);
      cb(null, hash);
    });
  }
  function restoreStubs() {
    fs.stat.restore();
    subtitlesDownloader.os.computeHash.restore();
  }

});