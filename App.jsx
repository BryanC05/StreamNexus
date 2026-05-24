import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectionPage from './SelectionPage.jsx';
import PlayerPage from './PlayerPage.jsx';
import ProfilePage from './ProfilePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectionPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}