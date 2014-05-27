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
subtitlesDownloader.downloadSubtitle = thunkify(subtitlesDownloader.downloadSubtitle);

describe("subtitles-downloader", function () {
  var testDir;

  beforeEach(function (done) {
    co(function* () {
      testDir = yield tmpDir();
    })(done);
  });

  describe("download subtitle", function () {
    it("should download a subtitle if the file exists", function (done) {
      co(function* () {
        var filePath = path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.mp4");
        var lang = "spa";

        prepareStubs(filePath, 225351574, "a1cb1a4680490e53");
        yield subtitlesDownloader.downloadSubtitle(filePath, lang);
        var fileExists = yield cfs.exists(path.join(testDir, "Silicon.Valley.S01E01.HDTV.x264-KILLERS.spa.srt"));
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