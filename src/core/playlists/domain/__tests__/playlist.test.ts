import { countPlaying, type PlaylistSound } from '..';

const sound = (id: string, playing: boolean): PlaylistSound => ({
  id,
  name: id,
  path: `sounds/${id}.ogg`,
  playing,
  volume: 0.5,
  repeat: false
});

describe('countPlaying', () => {
  it('counts the sounds that play', () => {
    expect(countPlaying([sound('a', true), sound('b', false), sound('c', true)])).toBe(2);
  });

  it('is zero for a silent or an empty playlist', () => {
    expect(countPlaying([sound('a', false)])).toBe(0);
    expect(countPlaying([])).toBe(0);
  });
});
