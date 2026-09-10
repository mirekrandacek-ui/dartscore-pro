from pathlib import Path
p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
old="""  const [lang, setLang] = useState(\n    ((navigator.language || 'cs').slice(0, 2)) || 'cs'\n  );\n"""
new="""  const [lang, setLang] = useState(() => {\n    const detectedLang = ((navigator.language || 'en').slice(0, 2)).toLowerCase();\n    return ['cs', 'en', 'de', 'es', 'nl', 'ru', 'zh'].includes(detectedLang)\n      ? detectedLang\n      : 'en';\n  });\n"""
if old not in s:
    raise SystemExit('language init anchor not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('language fallback patch applied')
