import test from 'node:test';
import assert from 'node:assert/strict';
import { createIOSPrivacy } from '../src/iosPrivacy.js';

test('concurrent banner and launch use one native consent request', async () => {
  let resolve;
  let calls = 0;
  const privacy = createIOSPrivacy({ preparePrivacy() {
    calls++;
    return new Promise(done => { resolve = done; });
  } });
  const first = privacy.prepare();
  const second = privacy.prepare();
  assert.equal(calls, 1);
  const denied = { canRequestAds: false, measurementEnabled: false };
  resolve(denied);
  assert.deepEqual(await first, denied);
  assert.deepEqual(await second, denied);
  await privacy.prepare();
  assert.equal(calls, 1);
});

test('failed refresh does not reuse a previous allowed result', async () => {
  let calls = 0;
  const privacy = createIOSPrivacy({ async preparePrivacy() {
    calls++;
    if (calls === 2) throw new Error('offline');
    return { canRequestAds: calls === 1 };
  } });
  assert.equal((await privacy.prepare()).canRequestAds, true);
  await assert.rejects(privacy.prepare({ refresh: true }), /offline/);
  assert.equal((await privacy.prepare()).canRequestAds, false);
  assert.equal(calls, 3);
});

test('privacy options wait for launch, and concurrent refresh cannot open another form', async () => {
  let resolve;
  let options = 0;
  let prepares = 0;
  const privacy = createIOSPrivacy({
    preparePrivacy() { prepares++; return new Promise(done => { resolve = done; }); },
    async showPrivacyOptions() { options++; return { measurementEnabled: false }; }
  });
  const launch = privacy.prepare();
  const change = privacy.showOptions();
  const foreground = privacy.prepare({ refresh: true });
  assert.equal(options, 0);
  resolve({ measurementEnabled: true });
  await launch;
  assert.equal((await change).measurementEnabled, false);
  assert.equal((await foreground).measurementEnabled, false);
  assert.equal(options, 1);
  assert.equal(prepares, 1);
});

test('failed privacy form invalidates consent cached by an earlier launch', async () => {
  let resolve;
  let calls = 0;
  const privacy = createIOSPrivacy({
    preparePrivacy() {
      calls++;
      if (calls === 1) return new Promise(done => { resolve = done; });
      return Promise.resolve({ measurementEnabled: false });
    },
    async showPrivacyOptions() { throw new Error('form unavailable'); }
  });
  const launch = privacy.prepare();
  const options = privacy.showOptions();
  resolve({ measurementEnabled: true });
  await launch;
  await assert.rejects(options, /unavailable/);
  assert.equal((await privacy.prepare()).measurementEnabled, false);
  assert.equal(calls, 2);
});
