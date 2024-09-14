// src/components/ChallengeRandom.js

import React, { useState, useEffect, useRef } from 'react';

function ChallengeRandom() {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [triesLeft, setTriesLeft] = useState(5);
  const [message, setMessage] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [guessHistory, setGuessHistory] = useState([]);
  const [inputValues, setInputValues] = useState([]);
  const inputRefs = useRef([]);

  // Prepare data for rendering input boxes
  let answerArray = [];
  let letterIndices = [];

  useEffect(() => {
    fetchRandomChallenge();
  }, []);

  async function fetchRandomChallenge() {
    try {
      const response = await fetch('/.netlify/functions/generateRandomChallenge');
      if (!response.ok) {
        throw new Error('Failed to fetch challenge.');
      }
      const challenge = await response.json();
      setCurrentChallenge(challenge);
      const numLetters = challenge.answer.replace(/[^A-Za-z]/g, '').length;
      setInputValues(Array(numLetters).fill(''));
      inputRefs.current = Array(numLetters).fill(null);
    } catch (error) {
      console.error('Error fetching random challenge:', error);
      setMessage('Failed to load challenge. Please try again later.');
    }
  }

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

  // Handle user input in the answer boxes
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

    const newGuessHistory = [...guessHistory, { guess: userAnswer, isCorrect: false }];
    setGuessHistory(newGuessHistory);
    setInputValues(Array(inputValues.length).fill('')); // Clear the input fields

    if (userAnswer.replace(/[^A-Z]/g, '') === correctAnswer) {
      // Correct answer
      setMessage(`${currentChallenge.fact}`);
      setGameEnded(true);

      // Update the last guess as correct
      newGuessHistory[newGuessHistory.length - 1].isCorrect = true;
      setGuessHistory(newGuessHistory);
    } else {
      // Incorrect answer
      const newTriesLeft = triesLeft - 1;
      setTriesLeft(newTriesLeft);

      if (newTriesLeft > 0) {
        setMessage(`Incorrect. Tries left: ${newTriesLeft}`);
      } else {
        setMessage(`Out of tries! The answer was ${currentChallenge.answer}.`);
        setGameEnded(true);
      }
    }
  }

  function copyResult() {
    let result = `TREZZLE RANDOM CHALLENGE ${guessHistory.length}/5\n\n`;
    guessHistory.forEach((entry, index) => {
      const status = entry.isCorrect ? '🟩' : '🟥';
      result += `${index + 1}. ${status}\n`;
    });
    navigator.clipboard.writeText(result);
    alert('Result copied to clipboard!');
  }

  if (!currentChallenge || !inputValues || inputValues.length === 0) {
    return <div>{message || 'Loading...'}</div>;
  }

  return (
    <div className="today-challenge">
      <h2>Random Challenge</h2>
      <div className="difficulty">
        Difficulty Level: <strong>{currentChallenge.level}</strong>
      </div>
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
      <button className="btn btn-primary mt-2" onClick={handleSubmit} disabled={gameEnded}>
        Submit Answer
      </button>
      <div className="tries">
        <br />
        {Array(triesLeft)
          .fill('🟩')
          .map((box, index) => (
            <span className="me-2" key={index}>
              {box}
            </span>
          ))}
      </div>
      {guessHistory.length > 0 && (
        <div className="guess-history">
          <h4>Your Attempts:</h4>
          <ul>
            {guessHistory.map((entry, index) => (
              <li className="guess-value" key={index}>
                {entry.isCorrect ? '🟩' : '🟥'}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="message">
        {message && <div className="speech-bubble">{message}</div>}
      </div>
      {gameEnded && (
        <div>
          <button className="btn btn-secondary me-2" onClick={copyResult}>
            Share Your Result
          </button>
        </div>
      )}
    </div>
  );
}

export default ChallengeRandom;
