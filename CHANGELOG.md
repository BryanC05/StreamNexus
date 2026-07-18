# Changelog

All notable changes to StreamNexus (FreeVid) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
