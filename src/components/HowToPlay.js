import React from 'react';
import '../styles/App.css';

function HowToPlay() {
  return (
    <div className="how-to-play-container">
      <h2>How To Play</h2>
      <p>
        Find the hidden city using the provided clues. Use a map (e.g., Google Maps) to help solve the treasure hunt.
      </p>
      <ul>
        <li>You have 5 tries to guess the correct city.</li>
        <li>Enter your guess by typing the city's name.</li>
        <li>After each guess, you'll receive directional hints.</li>
        <li>A new puzzle is released daily at midnight EST.</li>
      </ul>
    </div>
  );
}

export default HowToPlay;
