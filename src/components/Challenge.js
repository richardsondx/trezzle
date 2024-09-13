// src/components/Challenge.js

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { START_DATE } from '../constants.js';

function Challenge({ challengeNumberProp }) {
  const { number } = useParams();
  const challengeNumber = challengeNumberProp || Number(number);
  const [locations, setLocations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [triesLeft, setTriesLeft] = useState(5);
  const [message, setMessage] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [guessHistory, setGuessHistory] = useState([]);
  const [inputValues, setInputValues] = useState([]);
  const inputRefs = useRef([]);

  // Prepare data for rendering input boxes
  let answerArray = [];
  let letterIndices = [];

  if (currentChallenge && currentChallenge.answer) {
    answerArray = currentChallenge.answer.toUpperCase().split('');
    answerArray.forEach((char, index) => {
      if (/[A-Z]/.test(char)) {
        letterIndices.push(index);
      }
    });
  }

  // Focus on the first input box when the game starts
  useEffect(() => {
    if (!gameEnded && letterIndices.length > 0 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [currentChallenge, gameEnded]);

  // Load game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`trezzle_game_state_${challengeNumber}`);
    if (savedState) {
      const state = JSON.parse(savedState);
      setCurrentChallenge(state.currentChallenge);
      setTriesLeft(state.triesLeft);
      setMessage(state.message);
      setGameEnded(state.gameEnded);
      setDifficulty(state.difficulty);
      setGuessHistory(state.guessHistory);

      // Initialize inputValues and inputRefs based on the number of letters
      const numLetters = state.currentChallenge.answer.replace(/[^A-Z]/gi, '').length;
      setInputValues(state.inputValues || Array(numLetters).fill(''));
      inputRefs.current = Array(numLetters).fill(null);
    } else {
      // If no saved state, initialize the game after data is fetched
      if (locations.length > 0 && countries.length > 0) {
        initializeGame(locations, countries);
      }
    }
  }, [challengeNumber, locations, countries]);

  // Save game state to localStorage
  useEffect(() => {
    if (currentChallenge) {
      const state = {
        currentChallenge,
        inputValues,
        triesLeft,
        message,
        gameEnded,
        difficulty,
        guessHistory,
      };
      localStorage.setItem(`trezzle_game_state_${challengeNumber}`, JSON.stringify(state));
    }
  }, [currentChallenge, inputValues, triesLeft, message, gameEnded, difficulty, guessHistory, challengeNumber]);

  // Fetch city and country data
  useEffect(() => {
    Promise.all([
      new Promise((resolve) => {
        Papa.parse('/worldcities.csv', {
          download: true,
          header: true,
          complete: function (results) {
            const cities = results.data;
            const validCities = cities.filter(city => city.city_ascii && city.lat && city.lng && city.population);
            resolve(validCities);
          },
        });
      }),
      axios.get('https://restcountries.com/v3.1/all').then(response => response.data),
    ]).then(([validCities, countriesData]) => {
      setLocations(validCities);
      setCountries(countriesData);
      // Initialize the game if no saved state exists
      const savedState = localStorage.getItem(`trezzle_game_state_${challengeNumber}`);
      if (!savedState) {
        initializeGame(validCities, countriesData);
      }
    });
  }, [challengeNumber]);

  // Initialize the game logic
  function initializeGame(locationData, countriesData) {
    const seed = calculateSeedFromNumber(challengeNumber);
    const challenge = generateChallenge(locationData, seed, countriesData);

    if (!challenge) {
      setMessage('No valid challenge could be generated. Please try again later.');
      return;
    }

    setCurrentChallenge(challenge);
    const numLetters = challenge.answer.replace(/[^A-Z]/gi, '').length;
    setInputValues(Array(numLetters).fill(''));
    setTriesLeft(5);
    setMessage('');
    setGameEnded(false);
    setDifficulty(challenge.level);
    setGuessHistory([]);
    inputRefs.current = Array(numLetters).fill(null);
  }

  function calculateSeedFromNumber(challengeNumber) {
    const startDate = new Date(START_DATE);
    const seedDate = new Date(startDate.getTime() + ((challengeNumber - 1) * 24 * 60 * 60 * 1000));
    const seed = seedDate.getFullYear() * 10000 + (seedDate.getMonth() + 1) * 100 + seedDate.getDate();
    return seed;
  }

  function generateChallenge(locationData, seed, countriesData) {
    const levels = {
      'Easy': locationData.filter(city => parseInt(city.population) > 5000000),
      'Medium': locationData.filter(city => parseInt(city.population) <= 5000000 && parseInt(city.population) > 1000000),
      'Hard': locationData.filter(city => parseInt(city.population) <= 1000000),
    };

    const levelKeys = Object.keys(levels);
    const levelIndex = seed % levelKeys.length;
    const level = levelKeys[levelIndex];
    const locationsInLevel = levels[level];

    if (!locationsInLevel || locationsInLevel.length === 0) {
      console.error(`No locations found for level ${level}`);
      return null;
    }

    let locationIndex = seed % locationsInLevel.length;
    let location = locationsInLevel[locationIndex];

    let attempts = 0;
    while ((!location.lat || !location.lng) && attempts < locationsInLevel.length) {
      locationIndex = (locationIndex + 1) % locationsInLevel.length;
      location = locationsInLevel[locationIndex];
      attempts++;
    }

    if (!location || !location.lat || !location.lng) {
      console.error('Could not find a valid location');
      return null;
    }

    // Find the country data
    const countryName = location.country;
    const country = countriesData.find(c => c.name.common.toLowerCase() === countryName.toLowerCase());

    const clues = generateClues(location, country);

    return {
      level: level,
      answer: location.city_ascii, // Use 'city_ascii' for the answer
      location: location,
      clues: clues,
      fact: `👑 The tresor is located in the city of ${location.city_ascii} in ${location.country}.`,
    };
  }

  function generateClues(location, country) {
    const clues = [];

    // Clue 1: Either longitude or latitude
    if (Math.random() < 0.5) {
      // Latitude clue
      const lat = parseFloat(location.lat);
      const latDirection = lat >= 0 ? 'north' : 'south';
      clues.push(`Sail to the ${Math.abs(lat).toFixed(1)}° ${latDirection}.`);
    } else {
      // Longitude clue
      const lng = parseFloat(location.lng);
      const lngDirection = lng >= 0 ? 'east' : 'west';
      clues.push(`Head towards ${Math.abs(lng).toFixed(1)}° ${lngDirection}.`);
    }

    // Clue 2: Compass clue
    const compassClue = generateCompassClue(location);
    clues.push(compassClue);

    // Clue 3: Neighboring countries
    if (country && country.borders && country.borders.length > 0) {
      clues.push(`You'll pass by ${country.borders.length} neighboring lands on your journey.`);
    } else {
      clues.push('The land you seek stands alone with no neighboring countries.');
    }

    // Clue 4: Flag colors or symbols
    const colors = getFlagColors(country);
    if (colors.length > 0) {
      clues.push(`Hoist the flag with colors of ${colors.join(', ')}.`);
    } else {
      clues.push('The flag bears unique symbols known to the locals.');
    }

    // Clue 5: Language origin or script
    const languageClue = generateLanguageClue(country);
    if (languageClue) {
      clues.push(languageClue);
    } else {
      clues.push('The local tongue holds ancient secrets.');
    }

    return clues;
  }

  function generateCompassClue(location) {
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);

    let clue = 'Your treasure lies';

    if (lat >= 45) {
      clue += ' in the cold northern realms.';
    } else if (lat <= -45) {
      clue += ' in the icy southern lands.';
    } else if (lng >= 90 || lng <= -90) {
      clue += ' in the far east or west.';
    } else {
      clue += ' somewhere in the temperate zones.';
    }

    return clue;
  }

  function getFlagColors(country) {
    if (!country || !country.flags || !country.flags.svg) return [];
    // Placeholder logic; you can use a library or API to get actual flag colors.
    // For example purposes, let's return some dummy colors.
    const knownColors = {
      'United States': ['red', 'white', 'blue'],
      'Canada': ['red', 'white'],
      // Add more countries as needed
    };
    return knownColors[country.name.common] || [];
  }

  function generateLanguageClue(country) {
    if (!country || !country.languages) return null;
    const languages = Object.values(country.languages);
    if (languages.length === 0) return null;

    const language = languages[0]; // Taking the first language
    return `The local tongue traces back to the ${language} language family.`;
  }

  function handleInputChange(e, inputIndex) {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]$/.test(value)) {
      const newInputValues = [...inputValues];
      newInputValues[inputIndex] = value;
      setInputValues(newInputValues);

      // Move to the next input if available
      if (inputIndex < inputValues.length - 1) {
        inputRefs.current[inputIndex + 1].focus();
      }
    } else if (value === '') {
      const newInputValues = [...inputValues];
      newInputValues[inputIndex] = '';
      setInputValues(newInputValues);
    }
  }

  function handleKeyDown(e, inputIndex) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (inputValues[inputIndex]) {
        const newInputValues = [...inputValues];
        newInputValues[inputIndex] = '';
        setInputValues(newInputValues);
      } else if (inputIndex > 0) {
        inputRefs.current[inputIndex - 1].focus();
      }
    }
  }

  function handleSubmit() {
    const userAnswer = inputValues.join('').trim().toUpperCase();
    const correctAnswer = currentChallenge.answer.toUpperCase().replace(/[^A-Z]/g, '');

    const newGuessHistory = [...guessHistory, userAnswer];
    setGuessHistory(newGuessHistory);
    setInputValues(Array(inputValues.length).fill('')); // Clear the input fields

    if (userAnswer.replace(/[^A-Z]/g, '') === correctAnswer) {
      // Correct answer
      setMessage(`${currentChallenge.fact}`);
      setGameEnded(true);
    } else {
      // Incorrect answer
      const newTriesLeft = triesLeft - 1;
      setTriesLeft(newTriesLeft);

      const directionHint = getDirectionHint(userAnswer);
      if (newTriesLeft > 0) {
        setMessage(`Arrr! Wrong, mate! ${directionHint} Tries left: ${newTriesLeft}`);
      } else {
        setMessage(`Out of tries! The answer was ${currentChallenge.answer}.`);
        setGameEnded(true);
      }
    }
  }

  function getDirectionHint(userAnswer) {
    const guessedLocation = locations.find(
      (location) => location.city_ascii.toUpperCase().replace(/[^A-Z]/g, '') === userAnswer.replace(/[^A-Z]/g, '')
    );

    if (!guessedLocation || !currentChallenge.location) {
      return 'That place is unknown to our maps.';
    }

    const guessedLat = parseFloat(guessedLocation.lat);
    const guessedLng = parseFloat(guessedLocation.lng);
    const actualLat = parseFloat(currentChallenge.location.lat);
    const actualLng = parseFloat(currentChallenge.location.lng);

    const latDifference = actualLat - guessedLat;
    const lngDifference = actualLng - guessedLng;

    const latDirection = latDifference > 0 ? 'north' : 'south';
    const lngDirection = lngDifference > 0 ? 'east' : 'west';

    return `You're off course! Try heading ${Math.abs(latDifference).toFixed(1)}° ${latDirection} and ${Math.abs(lngDifference).toFixed(1)}° ${lngDirection}.`;
  }

  function copyResult() {
    let result = `TREZZLE N.${challengeNumber} ${guessHistory.length}/5\n\n`;
    guessHistory.forEach((guess, index) => {
      const isCorrect = guess.toUpperCase().replace(/[^A-Z]/g, '') === currentChallenge.answer.toUpperCase().replace(/[^A-Z]/g, '');
      const status = isCorrect ? '🟩' : '🟥';
      result += `${index + 1}. ${guess} ${status}\n`;
    });
    navigator.clipboard.writeText(result);
    alert('Result copied to clipboard!');
  }

  function shareChallenge() {
    const url = `${window.location.origin}/challenge/${challengeNumber}`;
    navigator.clipboard.writeText(url);
    alert('Challenge URL copied to clipboard!');
  }

  if (!currentChallenge || !inputValues || inputValues.length === 0) {
    return <div>{message || 'Loading...'}</div>;
  }

  return (
    <div className="today-challenge">
      <h2>{`Challenge No. ${challengeNumber}`}</h2>
      <div className="difficulty">Difficulty Level: <strong>{difficulty}</strong></div>
      <div className="clues text-center mt-2">
        <h3>🗺️ Clues</h3>
        <ol className="list-unstyled">
          {currentChallenge.clues.map((clue, index) => (
            <li key={index}>✦ {clue}</li>
          ))}
        </ol>
      </div>
      <div className="answer-boxes">
        {answerArray.map((char, index) => {
          if (/[A-Z]/.test(char)) {
            const inputIndex = letterIndices.indexOf(index);
            return (
              <input
                key={index}
                type="text"
                value={inputValues[inputIndex] || ''}
                onChange={(e) => handleInputChange(e, inputIndex)}
                onKeyDown={(e) => handleKeyDown(e, inputIndex)}
                ref={(el) => (inputRefs.current[inputIndex] = el)}
                disabled={gameEnded}
                className="letter-input"
                autoFocus={inputIndex === 0}
              />
            );
          } else {
            return (
              <div key={index} className="non-letter">
                {char}
              </div>
            );
          }
        })}
      </div>
      <button className="btn btn-primary mt-2" onClick={handleSubmit} disabled={gameEnded}>Submit Answer</button>
      <div className="tries">
        <br/>
        {Array(triesLeft).fill('🟩').map((box, index) => (
          <span className="me-2" key={index}>{box}</span>
        ))}
      </div>
      {guessHistory.length > 0 && (
        <div className="guess-history">
          <h4>Your Guesses:</h4>
          <ul>
            {guessHistory.map((guess, index) => (
              <li className="guess-value" key={index}>{guess}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="message">
        {message && (
          <div className="speech-bubble">
            {message}
          </div>
        )}
      </div>
      <span style={{fontSize: '30px'}}>🦜</span>
      {gameEnded && (
        <div>
          <p>Try the next challenge tomorrow at midnight EST!</p>
          <button className="btn btn-secondary me-2" onClick={copyResult}>Share Your Result</button>
          <button className="btn btn-secondary" onClick={shareChallenge}>Share This Challenge</button>
        </div>
      )}
    </div>
  );
}

export default Challenge;
