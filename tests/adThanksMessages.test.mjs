import test from 'node:test';
import assert from 'node:assert/strict';
import { AD_THANKS_MESSAGES, pickNextAdThanks } from '../src/adThanksMessages.js';

test('exactly 20 positive messages in all supported languages', () => {
  const languages = ['cs', 'en', 'de', 'es', 'nl', 'ru', 'zh'];
  assert.deepEqual(Object.keys(AD_THANKS_MESSAGES).sort(), languages.sort());
  for (const lang of languages) {
    assert.equal(AD_THANKS_MESSAGES[lang].length, 20, lang);
    assert.equal(new Set(AD_THANKS_MESSAGES[lang]).size, 20, lang);
    assert.ok(AD_THANKS_MESSAGES[lang].every(message => message.trim().length >= 10), lang);
  }
});

test('never repeats previous message, including either boundary', () => {
  for (const lang of Object.keys(AD_THANKS_MESSAGES)) {
    for (const last of Array.from({ length: 20 }, (_, i) => i)) {
      for (const random of [() => 0, () => 0.25, () => 0.9, () => 0.999999]) {
        const { index, message } = pickNextAdThanks(lang, last, random);
        assert.notEqual(index, last, lang);
        assert.equal(message, AD_THANKS_MESSAGES[lang][index], lang);
      }
    }
  }
});

test('falls back to English for unsupported language', () => {
  assert.equal(pickNextAdThanks('xx', -1, () => 0).message, AD_THANKS_MESSAGES.en[0]);
});

test('the two agreed replacement lines are included', () => {
  assert.equal(AD_THANKS_MESSAGES.cs[14], '🎯 Reklama je fuč! Teď už jen trefovat správná čísla!');
  assert.equal(AD_THANKS_MESSAGES.cs[18], '😎 Díky za trpělivost! Vývojář teď hodil 180. Teda skoro.');
});
