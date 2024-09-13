// src/components/TodayChallenge.js

import React from 'react';
import Challenge from './Challenge';
import { START_DATE } from '../constants.js'

function TodayChallenge() {
  const estOffset = -5.0; // EST is UTC-5
  const estDate = new Date(new Date().getTime() + (estOffset * 60 * 60 * 1000));
  const challengeNumber = calculateChallengeNumber(estDate);

  function calculateChallengeNumber(date) {
    const startDate = new Date(START_DATE);
    const timeDiff = date - startDate;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <Challenge challengeNumberProp={challengeNumber} />
  );
}

export default TodayChallenge;