var path = require("path");

exports.subtitlePath = function(filePath, lang, subtitleExtension) {
  subtitleExtension || (subtitleExtension = "srt");
  var extension = path.extname(filePath);
  var base = filePath.substring(0, filePath.length - extension.length);
  return base + "." + lang + "." + subtitleExtension;
};