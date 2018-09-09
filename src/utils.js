var path = require("path");

exports.subtitlePath = function(filePath, lang, subtitleExtension, addLangToFileName) {
  subtitleExtension || (subtitleExtension = "srt");
  var extension = path.extname(filePath);
  var base = filePath.substring(0, filePath.length - extension.length);
  if (addLangToFileName) {
    return base + "." + lang + "." + subtitleExtension;
  } else {
    return base + "." + subtitleExtension;
  }
};

exports.escapeGlobCharacters = function (pattern) {
  return pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g , '\\$&');
};
