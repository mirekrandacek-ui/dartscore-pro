const fallback = 'cs'

const dict = {}
export async function initI18n() {
  const lang = (navigator.language || 'cs').slice(0,2)
  const chosen = ['cs','en','de','ru','nl','es'].includes(lang) ? lang : fallback
  const mod = await import(`./locales/${chosen}.json`)
  dict.current = mod.default
  dict.lang = chosen
}

export function t(key) {
  return (dict.current && dict.current[key]) || key
}

export function getLang() {
  return dict.lang || 'cs'
}

export async function setLang(lang) {
  const mod = await import(`./locales/${lang}.json`)
  dict.current = mod.default
  dict.lang = lang
}
