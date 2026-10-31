import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ThemePicker from './ThemePicker.jsx';
import { CloseIcon, PaletteIcon } from './Icons.jsx';
import { getThemeMeta, setActiveTheme, useActiveTheme } from '../lib/theme.js';

export default function ThemeMenu() {
  const activeTheme = useActiveTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="icon-button theme-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Change theme"
        onClick={() => setOpen(true)}
      >
        <PaletteIcon size={17} />
        <span className="theme-trigger-label">Theme</span>
      </button>

      {open && createPortal(
        <div className="theme-modal" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="theme-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="theme-modal-head">
              <div>
                <p className="eyebrow">Appearance</p>
                <h2 id="theme-modal-title">Pick a look</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close theme picker">
                <CloseIcon />
              </button>
            </header>
            <ThemePicker activeId={activeTheme} onPick={setActiveTheme} />
            <p className="theme-modal-hint">
              {getThemeMeta(activeTheme).name} applies instantly and is remembered on this device.
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
