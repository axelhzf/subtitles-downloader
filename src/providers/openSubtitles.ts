import * as _ from 'lodash';
const OS = require('opensubtitles-api');

const userAgent = 'OpenSubtitlesPlayer v4.7';

export type Credentials = { username: string; password: string };

export async function searchByFile(
  filePath: string,
  lang: string,
  credentials: Credentials
): Promise<Subtitle[]> {
  const OpenSubtitles = new OS({
    useragent: userAgent,
    ...credentials,
    ssl: true
  });

  const result = await OpenSubtitles.search({
    sublanguageid: lang,
    path: filePath,
    limit: '5',
    gzip: true
  });

  return _.map(_.flatten(_.values(result)), result => ({
    lang: result.langcode,
    url: result.utf8,
    fileName: result.filename
  }));
}

type Subtitle = {
  lang: string;
  url: string;
  fileName: string;
};
