// src/components/Challenge.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Challenge({ challengeNumberProp }) {
  const { number } = useParams();
  const challengeNumber = challengeNumberProp || Number(number);
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

  if (currentChallenge && currentChallenge.answer_length) {
    // Create an array of underscores representing each letter
    answerArray = Array(currentChallenge.answer_length).fill('_');
    answerArray.forEach((_, index) => {
      letterIndices.push(index);
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
      setGuessHistory(state.guessHistory);

      // Initialize inputValues and inputRefs based on the number of letters
      const numLetters = state.currentChallenge.answer_length;
      setInputValues(state.inputValues || Array(numLetters).fill(''));
      inputRefs.current = Array(numLetters).fill(null);
    } else {
      // Fetch the challenge from Supabase
      fetchChallenge();
    }
  }, [challengeNumber]);

  // Save game state to localStorage
  useEffect(() => {
    if (currentChallenge) {
      const state = {
        currentChallenge,
        inputValues,
        triesLeft,
        message,
        gameEnded,
        guessHistory,
      };
      localStorage.setItem(`trezzle_game_state_${challengeNumber}`, JSON.stringify(state));
    }
  }, [currentChallenge, inputValues, triesLeft, message, gameEnded, guessHistory, challengeNumber]);

  // Fetch challenge from Supabase
  async function fetchChallenge() {
    let { data, error } = await supabase
      .from('challenges_view')
      .select('*')
      .eq('id', challengeNumber)
      .single();
  
    // If not found in today's challenges, check past challenges
    if (error || !data) {
      ({ data, error } = await supabase
        .from('challenges_past_view')
        .select('*')
        .eq('id', challengeNumber)
        .single());
    }
  
    if (error || !data) {
      console.error('Error fetching challenge:', error);
      setMessage('Challenge not found. Please try again later.');
    } else {
      console.log('Fetched challenge data:', data);
      setCurrentChallenge(data);
      const numLetters = data.answer_length;
      setInputValues(Array(numLetters).fill(''));
      inputRefs.current = Array(numLetters).fill(null);
    }
  }  

  // Handle user input in the answer boxes
  function handleInputChange(e, inputIndex) {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]$/.test(value)) {
      const newInputValues = [...inputValues];
      newInputValues[inputIndex] = value;
      setInputValues(newInputValues);

      // Move to the next input if available and exists
      if (inputIndex < inputValues.length - 1 && inputRefs.current[inputIndex + 1]) {
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

  async function handleSubmit() {
    const userAnswer = inputValues.join('').trim();
  
    // Call the Supabase function to check the answer
    const { data: isCorrect, error } = await supabase.rpc('check_user_answer', {
      challenge_id: challengeNumber,
      user_answer: userAnswer,
    });
  
    if (error) {
      console.error('Error checking answer:', error);
      setMessage('Error checking answer. Please try again later.');
      return;
    }
  
    const newGuessHistory = [...guessHistory, { guess: userAnswer, isCorrect }];
    setGuessHistory(newGuessHistory);
    setInputValues(Array(inputValues.length).fill('')); // Clear the input fields
  
    if (isCorrect) {
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
        setMessage(`Out of tries! The answer was not correct.`);
        setGameEnded(true);
      }
    }
  }  

  function getDirectionHint(userAnswer) {
    // Since we don't have access to the actual answer's coordinates,
    // we can use a placeholder hint or fetch necessary data if available.
    // For demonstration, we'll use a generic hint.

    return 'That place is unknown to our maps.';
  }

  function copyResult() {
    let result = `TREZZLE N.${challengeNumber} ${guessHistory.length}/5\n\n`;
    guessHistory.forEach((entry, index) => {
      const status = entry.isCorrect ? '🟩' : '🟥';
      result += `${index + 1}. ${status}\n`;
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
        {answerArray.map((_, index) => {
          return (
            <input
              key={index}
              type="text"
              value={inputValues[index] || ''}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={gameEnded}
              className="letter-input"
              autoFocus={index === 0}
            />
          );
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
          <h4>Your Guesses:</h4>
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
      <span style={{ fontSize: '30px' }}>🦜</span>
      {gameEnded && (
        <div>
          <p>Try the next challenge tomorrow at midnight EST!</p>
          <button className="btn btn-secondary me-2" onClick={copyResult}>
            Share Your Result
          </button>
          <button className="btn btn-secondary" onClick={shareChallenge}>
            Share This Challenge
          </button>
        </div>
      )}
    </div>
  );
}

export default Challenge;
