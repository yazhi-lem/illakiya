import { describe, expect, it } from 'vitest';
import { transliterateWord } from './translit';

describe('transliterateWord', () => {
  it('composes mei + uyir into uyirmei', () => {
    expect(transliterateWord('thamizh')).toBe('தமிழ்');
    expect(transliterateWord('kaadhal')).toBe('காதல்');
  });

  it('handles retroflex N and gemination', () => {
    expect(transliterateWord('vaNakkam')).toBe('வணக்கம்');
    expect(transliterateWord('paLLam')).toBe('பள்ளம்');
  });

  it('resolves dental vs alveolar n by position', () => {
    expect(transliterateWord('naan')).toBe('நான்');
    expect(transliterateWord('nuul')).toBe('நூல்');
    expect(transliterateWord('en')).toBe('என்');
  });

  it('renders standalone vowels', () => {
    expect(transliterateWord('amma')).toBe('அம்ம');
    expect(transliterateWord('ammaa')).toBe('அம்மா');
    expect(transliterateWord('ilakkiyaa')).toBe('இலக்கியா');
  });

  it('keeps word boundaries and passthrough characters', () => {
    expect(transliterateWord('en peyar')).toBe('என் பெயர்');
    expect(transliterateWord('tamil 2!')).toBe('டமில் 2!');
  });

  it('expands grantha clusters', () => {
    expect(transliterateWord('lakshmi')).toBe('லக்ஷ்மி');
  });
});
