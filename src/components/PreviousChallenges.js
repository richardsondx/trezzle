// src/components/PreviousChallenges.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PreviousChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [challengeData, setChallengeData] = useState([]);

  useEffect(() => {
    fetch('/previousChallenges.json')
      .then(response => response.json())
      .then(data => {
        setChallengeData(data);
        setChallenges(data);
      });
  }, []);

  function showAnswer(challengeNumber) {
    const challenge = challengeData.find(challenge => challenge.number === challengeNumber);
    if (challenge) {
      console.log("challenge: " + JSON.stringify(challenge))
      console.log(challenge.answer)
      alert(`Answer for challenge No. ${challengeNumber} is ${challenge.challenge.answer}`);
    } else {
      alert('Challenge data not available.');
    }
  }

  const filteredChallenges = challenges.filter(challenge =>
    challenge.number.toString().includes(searchNumber)
  );

  return (
    <div className="container col-lg-8 col-12">
      <h2>Previous Challenges</h2>
      <input
        type="number"
        placeholder="Search by Number"
        value={searchNumber}
        onChange={(e) => setSearchNumber(e.target.value)}
        className="form-control mb-3"
      />
      <ul className="list-group">
        {filteredChallenges.slice().reverse().map((challenge) => (
          <li key={challenge.number} className="list-group-item mb-2">
            <div className="row">
              <div className="col-md-8">
                {challenge.date} – No. {challenge.number}
              </div>
              <div className="col-md-4 text-right">
                <Link to={`/challenge/${challenge.number}`} className="btn btn-primary btn-sm me-2">
                  Take this Challenge
                </Link>
                <button className="btn btn-secondary btn-sm" onClick={() => showAnswer(challenge.number)}>
                  Show Answer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PreviousChallenges;
