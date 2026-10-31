import { Link, NavLink } from 'react-router-dom';
import ThemeMenu from './ThemeMenu.jsx';
import { PlayIcon, UserIcon } from './Icons.jsx';
import { getUsername, isLoggedIn } from '../app.js';

export default function SiteHeader({ actions = null, profileLabel = 'Profile' }) {
  const loggedIn = isLoggedIn();
  const username = loggedIn ? getUsername() : '';

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="FreeVid home">
        <span className="brand-mark" aria-hidden="true"><PlayIcon size={14} /></span>
        <span className="brand-word">Free<span>Vid</span></span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => `site-nav-link ${isActive ? 'is-active' : ''}`}>
          Browse
        </NavLink>
        <NavLink to="/sources" className={({ isActive }) => `site-nav-link ${isActive ? 'is-active' : ''}`}>
          Sources
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `site-nav-link ${isActive ? 'is-active' : ''}`}>
          {profileLabel}
        </NavLink>
      </nav>

      <div className="site-header-actions">
        {actions}
        <Link className="account-chip" to="/profile" title={loggedIn ? `Signed in as ${username}` : 'Sign in to sync'}>
          <span className="account-avatar" aria-hidden="true">{loggedIn ? username.slice(0, 1).toUpperCase() : <UserIcon size={14} />}</span>
          <span className="account-name">{loggedIn ? username : 'Sign in'}</span>
        </Link>
        <ThemeMenu />
      </div>
    </header>
  );
}
