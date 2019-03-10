#!/usr/bin/env node

import meow from 'meow';
import { downloadSubtitle } from './index';
import glob from 'glob';
import { promisify } from 'util';
import chalk from 'chalk';
import * as _ from 'lodash';
import pLimit from 'p-limit';

const asyncGlob = promisify(glob);

async function main() {
  const cli = meow(
    `
    Usage
      $ subtitles-downloader [options]
 
    Options
      --help, -h          Usage Information
      --version, -v       Show Version
      --file <path>, -f   File path or glob
      --lang <langs>      Languages
      --os-user           OpenSubtitles username 
      --os-password       OpenSubtitles password
 
    Examples
      $ npx subtitles-downloader -f movie.mkv -l spa,eng,ru 
      $ npx subtitles-downloader -f "movies/*.mkv" -l spa,eng
`,
    {
      flags: {
        help: {
          type: 'boolean',
          alias: 'h'
        },
        version: {
          type: 'boolean',
          alias: 'v'
        },
        file: {
          type: 'string',
          alias: 'f',
          default: '*.+(mkv|avi|mp4)'
        },
        lang: {
          type: 'string',
          alias: 'l',
          default: 'eng'
        },
        osUser: {
          type: 'string',
        },
        osPassword: {
          type: 'string'
        }
      }
    }
  );

  if (cli.flags.help) cli.showHelp();
  if (cli.flags.version) cli.showVersion();

  const file = cli.flags.file;
  const langs: string[] = cli.flags.lang.split(',');

  const files = await asyncGlob(file);
  if (files.length === 0) {
    error(`No matching files for expressions ${file}`);
    process.exit(1);
  }

  const credentials = {
    username: cli.flags.osUser || process.env.OS_USER || '',
    password: cli.flags.osPassword || process.env.OS_PASSWORD || ''
  };

  async function processFile(file: string, lang: string) {
    info(`Searching subs for ${file} in ${lang}`);
    const subtitlePath = await downloadSubtitle(file, lang, credentials);
    if (subtitlePath) {
      success(`Downloaded - ${subtitlePath}`);
    } else {
      warn(`Not found - ${file} - ${lang}`);
    }
  }

  const limit = pLimit(3);
  await Promise.all(_.flatMap(files, file =>
    _.map(langs, lang => limit(() => processFile(file, lang)))
  ));

}

function error(msg: string) {
  console.error(`${chalk.red('[error]')} ${msg}`);
}

function warn(msg: string) {
  console.error(`${chalk.yellow('[warn]')} ${msg}`);
}

function info(msg: string) {
  console.error(`${chalk.blue('[info]')} ${msg}`);
}

function success(msg: string) {
  console.error(`${chalk.green('[info]')} ${msg}`);
}

main().catch(e => error(e.message));
