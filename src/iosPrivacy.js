// The native bridge reads consent and ATT itself; JavaScript never grants consent.
export function createIOSPrivacy(bridge) {
  let prepared;
  let pending;

  const start = operation => {
    const request = operation.then(result => {
      prepared = result;
      return result;
    }).finally(() => { if (pending === request) pending = undefined; });
    pending = request;
    return request;
  };

  const prepare = ({ refresh = false } = {}) => {
    if (pending) return pending;
    if (prepared && !refresh) return Promise.resolve(prepared);
    prepared = undefined;
    return start(bridge.preparePrivacy());
  };

  return {
    prepare,
    showOptions() {
      const previous = pending || Promise.resolve();
      prepared = undefined;
      return start(previous.catch(() => {}).then(() => {
        prepared = undefined;
        return bridge.showPrivacyOptions();
      }));
    }
  };
}

export const privacyChoicesLabel = {
  cs: 'Nastavení soukromí', en: 'Privacy choices', de: 'Datenschutzeinstellungen',
  es: 'Opciones de privacidad', nl: 'Privacyinstellingen', ru: 'Настройки конфиденциальности',
  zh: '隐私设置'
};
