import { AVAILABLE_THEMES } from '../lib/theme.js';
import { CheckIcon } from './Icons.jsx';

export default function ThemePicker({ activeId, onPick }) {
  return (
    <div className="theme-grid" role="group" aria-label="Themes">
      {AVAILABLE_THEMES.map(theme => {
        const active = theme.id === activeId;
        return (
          <button
            key={theme.id}
            type="button"
            className={`theme-card ${active ? 'is-active' : ''}`}
            onClick={() => onPick(theme.id)}
            aria-pressed={active}
          >
            <span className="theme-swatch" aria-hidden="true">
              {theme.palette.map((color, index) => (
                <span key={index} className="theme-swatch-band" style={{ background: color }} />
              ))}
            </span>
            <span className="theme-card-copy">
              <strong>{theme.name}</strong>
              <span>{theme.description}</span>
            </span>
            {active && <span className="theme-card-check"><CheckIcon size={13} /></span>}
          </button>
        );
      })}
    </div>
  );
}
