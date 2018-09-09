# subtitles-downloader

Download subtitles from OpenSubtitles.org.

This library uses javascript generators. When using node 0.11.x or greater, you must use the `--harmony-generators` flag or just `--harmony` to get access to generators.

## Installation

    npm install subtitles-downloader -g

## cli usage

    Usage: subtitles-downloader [options]

    Options:

        -h, --help           output usage information
        -V, --version        output the version number
        -f, --file <path>    File path, or glob
        -l, --langs <langs>  Languages (default English)
        -m, --mix            Mix two subtitles into one
        -s, --special        Use special characters for advanced file matching


Examples

    subtitles-downloader -f movie.mkv -l spa,eng,ru --mix
    subtitles-downloader -f "movies/*.mkv" -l spa,eng -s

## Debug

    DEBUG=* subtitles-downloader -f movie.mkv -l spa,eng
    DEBUG=subtitles-downloader subtitles-downloader -f movie.mkv -l spa,eng
