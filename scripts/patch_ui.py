from pathlib import Path

app = Path('src/App.jsx')
css = Path('src/app.css')
s = app.read_text(encoding='utf-8')
c = css.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)


s = replace_once(
    s,
    "import React, { useEffect, useMemo, useRef, useState } from 'react';\n",
    "import React, { useEffect, useMemo, useRef, useState } from 'react';\nimport { createPortal } from 'react-dom';\n",
    'react-dom portal import'
)

marker = "const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;\n"
component = r'''

const ThemedSelect = ({
  value,
  onChange,
  children,
  className = '',
  style = {},
  title,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const options = React.Children.toArray(children)
    .filter(child => React.isValidElement(child) && child.type === 'option')
    .map(child => ({
      value: child.props.value ?? '',
      label: child.props.children,
      disabled: !!child.props.disabled
    }));

  const selected = options.find(opt => String(opt.value) === String(value)) || options[0];

  const positionMenu = () => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 6;
    const edge = 8;
    const desiredHeight = Math.min(280, Math.max(44, options.length * 42 + 8));
    const roomBelow = window.innerHeight - rect.bottom - edge;
    const roomAbove = rect.top - edge;
    const openUp = roomBelow < Math.min(desiredHeight, 180) && roomAbove > roomBelow;
    const maxHeight = Math.max(80, Math.min(desiredHeight, openUp ? roomAbove - gap : roomBelow - gap));
    const width = Math.max(rect.width, 150);
    const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge));
    const top = openUp
      ? Math.max(edge, rect.top - gap - maxHeight)
      : Math.min(window.innerHeight - edge - maxHeight, rect.bottom + gap);

    setMenuStyle({ left, top, width, maxHeight });
  };

  useEffect(() => {
    if (!open) return undefined;

    positionMenu();

    const closeIfOutside = event => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const reposition = () => positionMenu();

    document.addEventListener('pointerdown', closeIfOutside, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      document.removeEventListener('pointerdown', closeIfOutside, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, options.length]);

  const choose = option => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } });
    setOpen(false);
  };

  const wrapperStyle = {
    minWidth: style?.minWidth,
    width: style?.width,
    flex: style?.flex
  };

  return (
    <span className="themedSelectWrap" style={wrapperStyle}>
      <button
        ref={triggerRef}
        type="button"
        className={`${className} themedSelectTrigger`.trim()}
        style={style}
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen(prev => !prev);
        }}
      >
        <span className="themedSelectValue">{selected?.label}</span>
        <span className={`themedSelectChevron ${open ? 'open' : ''}`} aria-hidden="true">⌄</span>
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="themedSelectMenu"
          style={menuStyle}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={`${String(option.value)}-${index}`}
                type="button"
                className={`themedSelectOption ${isSelected ? 'selected' : ''}`}
                disabled={option.disabled}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option)}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </span>
  );
};
'''

s = replace_once(s, marker, marker + component, 'themed select component insertion')

open_count = s.count('<select')
close_count = s.count('</select>')
if open_count != close_count or open_count < 1:
    raise SystemExit(f'unexpected select counts: open={open_count}, close={close_count}')
s = s.replace('<select', '<ThemedSelect')
s = s.replace('</select>', '</ThemedSelect>')

s = replace_once(
    s,
    'className="btn"\n                          onClick={runRouletteDraw}',
    'className="btn rouletteDrawBtn"\n                          onClick={runRouletteDraw}',
    'roulette draw class'
)
s = replace_once(
    s,
    'className="btn green"\n                          onClick={() => {',
    'className="btn rouletteHitBtn"\n                          onClick={() => {',
    'roulette hit class'
)
s = replace_once(
    s,
    'className="btn ghost"\n                          onClick={rouletteSwitchPlayer}',
    'className="btn rouletteSwitchBtn"\n                          onClick={rouletteSwitchPlayer}',
    'roulette switch class'
)

s = replace_once(
    s,
    "    <div>{t(lang, 'premiumFeature4')}</div>",
    "    <div style={{ marginBottom: '12px' }}>{t(lang, 'premiumFeature4')}</div>",
    'premium details spacing'
)

c += r'''

/* === THEMED CUSTOM DROPDOWNS === */
.themedSelectWrap{
  display:inline-flex;
  position:relative;
  max-width:100%;
}
.themedSelectTrigger{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  text-align:left;
  cursor:pointer;
  background:linear-gradient(180deg,#1b1f25,#12151a) !important;
  color:#fff !important;
  border:1px solid var(--accent) !important;
  border-radius:10px !important;
  box-shadow:inset 0 0 0 1px #0005,0 0 0 1px #0004;
}
.themedSelectTrigger:disabled{
  cursor:default;
  opacity:.55;
}
.themedSelectValue{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.themedSelectChevron{
  flex:0 0 auto;
  color:var(--accent);
  font-size:18px;
  line-height:1;
  transform:translateY(-1px);
  transition:transform .16s ease;
}
.themedSelectChevron.open{
  transform:translateY(1px) rotate(180deg);
}
.themedSelectMenu{
  position:fixed;
  z-index:20000;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:4px;
  background:#171a1f;
  border:1px solid var(--accent);
  border-radius:10px;
  box-shadow:0 14px 34px #000c,0 0 0 1px #0007;
}
.themedSelectOption{
  width:100%;
  min-height:38px;
  display:flex;
  align-items:center;
  padding:8px 10px;
  border:0;
  border-radius:8px;
  background:transparent;
  color:#fff;
  font:inherit;
  font-size:14px;
  text-align:left;
  cursor:pointer;
}
.themedSelectOption + .themedSelectOption{
  margin-top:2px;
}
.themedSelectOption:hover,
.themedSelectOption:focus-visible{
  outline:none;
  background:#24282e;
}
.themedSelectOption.selected{
  background:var(--accent);
  color:#fff;
  font-weight:900;
}

/* === FIXED ROULETTE ACTION COLORS === */
.rouletteControls .rouletteDrawBtn{
  background:linear-gradient(180deg,#3b82f6,#1d4ed8) !important;
  border-color:#60a5fa !important;
  color:#fff !important;
  text-transform:uppercase;
}
.rouletteControls .rouletteHitBtn{
  background:linear-gradient(180deg,#22c55e,#15803d) !important;
  border-color:#4ade80 !important;
  color:#fff !important;
}
.rouletteControls .rouletteSwitchBtn{
  background:linear-gradient(180deg,#fde047,#eab308) !important;
  border-color:#facc15 !important;
  color:#171717 !important;
}
.rouletteControls .rouletteDrawBtn:disabled,
.rouletteControls .rouletteHitBtn:disabled,
.rouletteControls .rouletteSwitchBtn:disabled{
  filter:saturate(.72) brightness(.78);
}
'''

app.write_text(s, encoding='utf-8')
css.write_text(c, encoding='utf-8')

print(f'replaced {open_count} native selects')
