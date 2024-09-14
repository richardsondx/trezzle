// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TodayChallenge from './components/TodayChallenge';
import PreviousChallenges from './components/PreviousChallenges';
import HowToPlay from './components/HowToPlay';
import Challenge from './components/Challenge';
import ChallengeRandom from './components/ChallengeRandom';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<TodayChallenge />} />
        <Route path="/challenge/:number" element={<Challenge />} />
        <Route path="/previous" element={<PreviousChallenges />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/challenge/random" component={ChallengeRandom} />
      </Routes>
    </Router>
  );
}

export default App;
