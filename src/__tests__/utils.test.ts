import { subtitlePath } from '../utils';

describe('utils', () => {
  describe('subtitlePath', () => {
    it('should create the subtitle path', () => {
      const file = 'Brooklyn.Nine-Nine.S06E09.iNTERNAL.480p.x264-mSD[eztv].mkv';
      expect(subtitlePath(file, 'spa')).toEqual('Brooklyn.Nine-Nine.S06E09.iNTERNAL.480p.x264-mSD[eztv].spa.srt');
    });

    it('should create the subtitle path with custom srt ext', () => {
      const file = 'Brooklyn.Nine-Nine.S06E09.iNTERNAL.480p.x264-mSD[eztv].mkv';
      expect(subtitlePath(file, 'eng', 'ast')).toEqual('Brooklyn.Nine-Nine.S06E09.iNTERNAL.480p.x264-mSD[eztv].eng.ast');
    });
  });
});
