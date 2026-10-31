# Changelog

All notable changes to StreamNexus (FreeVid) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Removed committed API keys and user database from version control; configuration now comes from `VITE_*` environment variables and `.env.example`
- Production now requires `JWT_SECRET`; removed the hardcoded fallback secret
- Added API rate limiting, request validation, restrictive CORS, security headers, and an 8-character minimum password
- Player `postMessage` events are only accepted from the active iframe

### Added
- Rotating hero poster wall: the browse hero is now filled edge-to-edge with six poster cards that reshuffle every 7 seconds, weighted toward trending/popular titles while still surfacing older ones; rotation pauses on hidden tabs and respects `prefers-reduced-motion`
- Player ambiance glow: an optional light halo around the player tinted from the current episode still or title backdrop (canvas palette sampling of CORS-enabled TMDB artwork), toggled from a player chip, persisted per device, off by default, and suppressed while fullscreen
- Rivestream playback provider (`https://www.rivestream.app/embed?type=…`) with query-string movie and TV URLs
- Sources page at `/sources` listing every playback provider (URL examples, subtitle and sandbox capabilities, outbound links) and the other tools and services the app uses, linked from the site header
- Player sandbox toggle next to the provider switcher, persisted per device and defaulting to off; the chip turns red when the sandbox is disabled and a toast explains the tradeoff
- Shared site header with browse/profile navigation, account actions, and a portal-based theme switcher on every page
- Token-based design system (`public/styles.css`) with compatibility aliases; theme files now override palette and typography only
- Visual theme picker with live preview cards in the profile appearance panel
- Durable storage adapter with Vercel KV / Upstash Redis REST support (local JSON file fallback)
- Tombstone-based sync deletes and clear-history timestamps so deletions no longer resurrect
- `npm test`, `npm run lint`, and a GitHub Actions CI workflow

### Changed
- Redesigned the whole app around the Air design language: full-bleed poster hero with a flat scrim, Anton uppercase headlines broken by a Caveat accent line, Inter 500 interface type, ghost and haze buttons, and flat surfaces with no shadows or gradients
- Promoted that component language into `public/themes/air.css`, shared by every skin; theme files now supply only a palette plus semantic canvas/card/media tokens, and the four radii (4/8/11/12px) stay fixed
- Rebuilt the skins as Air, Air Light, Modern Dark, and Netflix Red: Haze light-island cards on dark canvases, white cards with ink hairlines on paper for Air Light, and a matching dark/light pair around one structure
- Reworked header navigation to underline links, added flat color-band theme previews, and replaced the player's hard-coded gold literals with theme tokens so the player follows every skin
- Chrome surfaces are now neutral glass: the site header, player topbar, provider switcher, chips, and toasts use translucent canvas panes with hairline borders instead of tinted navy
- Removed the homepage catalog counters and TMDB load status line from the hero; the shelf counts and search results already communicate catalog size
- Clean-UI pass: animated ambient orbs behind the browse page, straightened hero posters, icon-only favorite buttons, and shorter hero copy
- UI/UX revamp across browse, profile, auth, and player: cinematic hero and search, control bar with filter chips and reset, drag-scroll shelves with count pills, skeleton loading, stat tiles, segmented collections, and a restyled player shell
- Login merges local data into the cloud account instead of overwriting it
- Progress estimation only runs for loaded, visible embeds without recent playback events
- Themes ship from `public/themes` and switch live without a reload
- Player providers are now VidCore (default), VidSrc.pm, Vidy, Atlantic, and 2Embed; dead or sandbox-rejecting hosts (VidSync, VidSrc.sh, VidSrc.in, Vidking, VidLink, VidNest, VidRock, MultiEmbed, VidFast, VidEasy) are removed, old saved selections migrate automatically
- Vidy refuses sandboxed frames, so selecting it with the sandbox on shows a warning; the iframe `allow` list now grants autoplay and fullscreen to any embed origin
- Player iframe sandbox is now a toggle: when enabled it omits top-navigation and popup permissions; it defaults to off so providers that break inside the sandbox still play
- Added one-click provider switching below the player
- Player page refresh: sticky compact header, full-bleed video on phones, player-first mobile ordering, horizontally scrolling season tabs, and a collapsible playback/subtitle tools panel (open on desktop, collapsed on mobile)
- Fixed horizontal page overflow on shelves and player reviews, and compacted the header brand and favorite buttons on phones

### Removed
- Legacy vanilla-JS pages (`player.html`, `profile.html`) and dead DOM code in `app.js`
- Committed `dist/` output

## [2.0.0] - 2026-07-18

### Added

#### Feature #6: Keyboard Shortcuts
- **Space** - Play/Pause video playback
- **F** - Toggle fullscreen mode
- **M** - Mute/Unmute audio
- **Arrow Left/Right** - Seek backward/forward 10 seconds
- **Arrow Up/Down** - Increase/decrease volume
- Shortcuts automatically disabled when typing in input fields
- Added toast notifications for keyboard actions

#### Feature #8: Theme Customization
- **4 Distinct Visual Themes**:
  - Royal Gold (default) - Elegant gold & dark aesthetic
  - Modern Dark - Sleek contemporary dark with blue accents
  - Netflix Red - Bold streaming service style
  - Minimal Light - Clean, airy light interface
- **Theme Picker UI** - Visual selector in Profile page with previews
- **Persistent Preference** - Theme saved to localStorage
- **Dynamic CSS Loading** - Theme loaded before React renders
- Cross-page theme consistency via `theme-changed` events

#### Feature #11: Personalized Recommendations
- **Genre Analysis** - Analyzes watch history to identify top 3 preferred genres
- **Smart Discovery** - Fetches TMDB recommendations based on favorite genres
- **Duplicate Prevention** - Excludes already-watched content
- **"Because You Watched" Row** - Dedicated carousel on SelectionPage
- **Fallback Logic** - Fills with popular items when insufficient history

### Changed
- Updated documentation to reflect new features
- Enhanced user experience with keyboard navigation

### Technical
- Added `getPersonalizedRecommendations()` function in app.js
- Added theme management utilities in ProfilePage.jsx
- Modified SelectionPage.jsx to load and display recommendations
- Added dynamic theme loading in index.html

## [1.0.0] - 2026-07-17

### Added
- Initial release of StreamNexus (FreeVid)
- TMDB integration for movie and TV show catalogs
- Multi-server video player with progress tracking
- Smart subtitle fetching and conversion
- User profile with favorites, history, and watch time
- Genre filtering and search functionality
- Responsive UI with scroll-snap carousels
