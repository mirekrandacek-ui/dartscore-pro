import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Execute the app's actual effect body. Only the native ad boundary and React
// setter are substituted; this catches errors in the iOS-only startup path.
const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const effect = source.match(/useEffect\(\(\) => \{\s*if \(!IS_IOS \|\| !premiumStateResolved\) return undefined;\s*let cancelled = false;\s*const syncIOSBanner = async \(\) => \{([\s\S]*?)\}, \[isPremium, premiumStateResolved\]\);/);
assert.ok(effect, 'iOS banner effect must be present');
const body = effect[0].slice('useEffect(() => {'.length).split('}, [isPremium, premiumStateResolved]);')[0]
  .replace('    syncIOSBanner();', '    return syncIOSBanner();');

async function sync({ premium = false, configured = true, shown = true, fail = false, ios = true, resolved = true } = {}) {
  const events = [];
  const context = vm.createContext({
    IS_IOS: ios,
    premiumStateResolved: resolved,
    isPremium: premium,
    IOS_BANNER_CONFIGURED: configured,
    AdMob: { removeBanner: async () => events.push('remove') },
    showIOSBanner: async () => {
      events.push('show');
      if (fail) throw new Error('Native banner unavailable');
      return shown;
    },
    setIosBannerVisible: value => events.push(['visible', value]),
    console: { warn: (...args) => events.push(['warning', ...args]) }
  });
  await vm.runInContext(`(async () => {${body}})()`, context);
  return events;
}

test('free iOS startup with configured banner reaches native show without ReferenceError', async () => {
  assert.deepEqual(await sync(), ['show', ['visible', true]]);
});
test('Premium removes banner and never requests an ad', async () => {
  assert.deepEqual(await sync({ premium: true }), ['remove', ['visible', false]]);
});
test('missing iOS banner configuration removes banner without ad request', async () => {
  assert.deepEqual(await sync({ configured: false }), ['remove', ['visible', false]]);
});
test('denied or unavailable ad readiness keeps banner hidden', async () => {
  assert.deepEqual(await sync({ shown: false }), ['show', ['visible', false]]);
});
test('native banner failure is handled and leaves banner hidden', async () => {
  const result = await sync({ fail: true });
  assert.equal(result[0], 'show');
  assert.equal(result[1][0], 'warning');
  assert.deepEqual(result[2], ['visible', false]);
});
test('non-iOS or unresolved entitlement does not request a banner', async () => {
  assert.deepEqual(await sync({ ios: false }), []);
  assert.deepEqual(await sync({ resolved: false }), []);
});
