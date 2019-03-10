import _ from 'lodash';
import * as openSubtitles from './providers/openSubtitles';
import { downloadGzip } from './download';
import * as utils from './utils';

export async function downloadSubtitle(
  filePath: string,
  lang: string,
  credentials: openSubtitles.Credentials
) {
  const subtitles = await openSubtitles.searchByFile(
    filePath,
    lang,
    credentials
  );
  const subtitle = _.first(subtitles);
  if (!subtitle) return;

  const subtitlePath = utils.subtitlePath(filePath, lang);
  await downloadGzip(subtitle.url, subtitlePath);

  return subtitlePath;
}
