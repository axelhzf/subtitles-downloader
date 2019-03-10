import path from 'path';

export function subtitlePath(
  filePath: string,
  lang: string,
  subtitleExtension: string = 'srt'
) {
  const extension = path.extname(filePath);
  const base = filePath.substring(0, filePath.length - extension.length);
  return base + '.' + lang + '.' + subtitleExtension;
}
