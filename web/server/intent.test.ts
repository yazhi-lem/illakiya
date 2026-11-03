import { describe, expect, it } from 'vitest';
import { conversionPayload, detectIntent, parseClassifierAnswer, scriptRatios, tanglishScore } from './intent';

const intentOf = (text: string, hasHistory = false) => detectIntent(text, hasHistory);

describe('detectIntent — pasted text is converted', () => {
  it('English paragraph → translate', () => {
    expect(intentOf('The meeting has been moved to Thursday afternoon because the hall is not available.')).toMatchObject({
      intent: 'translate',
      confidence: 'high',
    });
  });

  it('Tanglish → clean', () => {
    expect(intentOf('naan nalla irukken, nee eppadi irukka?')).toMatchObject({ intent: 'clean' });
    expect(intentOf('naalaikku office ku late ah varuven')).toMatchObject({ intent: 'clean', confidence: 'high' });
    expect(intentOf('vanakkam, eppadi irukkeenga?')).toMatchObject({ intent: 'clean', confidence: 'high' });
  });

  it('Tamil text → grammar', () => {
    expect(intentOf('நான் நேற்று பள்ளிக்கு போனேன் அங்கு நண்பர்களை பார்த்தேன்')).toMatchObject({
      intent: 'grammar',
      confidence: 'high',
    });
  });

  it('a conversion verb up front, even on short text', () => {
    expect(intentOf('Translate: I love Tamil')).toMatchObject({ intent: 'translate', confidence: 'high' });
    expect(intentOf('இந்த உரையை சரிபார்: நான் பள்ளிக்கு போனேன்')).toMatchObject({ intent: 'grammar' });
    expect(conversionPayload('Translate: I love Tamil')).toBe('I love Tamil');
    expect(conversionPayload('இந்த உரையை சரிபார்:\nநான் பள்ளிக்கு போனேன்')).toBe('நான் பள்ளிக்கு போனேன்');
    expect(conversionPayload('Good morning: all')).toBe('Good morning: all');
  });

  it('long text with an explicit request in front', () => {
    const body = ' The quick brown fox jumps over the lazy dog.'.repeat(10);
    expect(intentOf(`Translate this:${body}`)).toMatchObject({ intent: 'translate', confidence: 'high' });
  });
});

describe('detectIntent — requests', () => {
  it('creative requests → write', () => {
    expect(intentOf('Write a poem about the monsoon')).toMatchObject({ intent: 'write', confidence: 'high' });
    expect(intentOf('அம்மாவுக்கு ஒரு பிறந்தநாள் வாழ்த்து எழுது')).toMatchObject({ intent: 'write', confidence: 'high' });
    expect(intentOf('Write a story for kids')).toMatchObject({ intent: 'write' });
    expect(intentOf('மழை பற்றி ஒரு கவிதை')).toMatchObject({ intent: 'write' });
  });

  it('factual requests → research with a query', () => {
    const d = intentOf('Write an essay about the history of the Chola dynasty');
    expect(d).toMatchObject({ intent: 'research', confidence: 'high' });
    expect(d.queries.en).toContain('Chola');
    expect(intentOf('திருவள்ளுவர் யார்?')).toMatchObject({ intent: 'research', queries: { ta: expect.any(String) } });
    expect(intentOf('சோழர் வரலாறு பற்றி கட்டுரை')).toMatchObject({ intent: 'research', queries: { ta: 'சோழர் வரலாறு' } });
    expect(intentOf('Thiruvalluvar pathi oru katturai ezhudhu')).toMatchObject({ intent: 'research', queries: { en: 'Thiruvalluvar' } });
  });

  it('unclear requests ask the classifier', () => {
    expect(intentOf('Can you help me with my speech tomorrow?')).toMatchObject({ confidence: 'low' });
  });

  it('short follow-ups revise the previous answer', () => {
    expect(intentOf('make it shorter', true)).toMatchObject({ intent: 'revise', confidence: 'high' });
    expect(intentOf('இன்னும் சுருக்கமாக', true)).toMatchObject({ intent: 'revise' });
    expect(intentOf('make it shorter', false).intent).not.toBe('revise');
  });
});

describe('helpers', () => {
  it('measures scripts and Tanglish', () => {
    expect(scriptRatios('தமிழ் abc').tamil).toBeGreaterThan(0.5);
    expect(tanglishScore('naan romba santhosama irukken')).toBeGreaterThan(0.5);
    expect(tanglishScore('I am very happy today')).toBe(0);
  });

  it('parses classifier answers defensively', () => {
    expect(parseClassifierAnswer('{"intent":"research","query_ta":"சோழர்","query_en":"Chola"}')).toEqual({
      intent: 'research',
      queries: { ta: 'சோழர்', en: 'Chola' },
    });
    expect(parseClassifierAnswer('Sure! {"intent":"write","query_ta":"","query_en":""}')).toEqual({
      intent: 'write',
      queries: { ta: undefined, en: undefined },
    });
    expect(parseClassifierAnswer('{"intent":"dance"}')).toBeNull();
    expect(parseClassifierAnswer('no json')).toBeNull();
  });
});
