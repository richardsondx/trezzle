// src/components/PreviousChallenges.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function PreviousChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [searchNumber, setSearchNumber] = useState('');

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function fetchChallenges() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .lt('date', today) // Fetch challenges where date is less than today
      .order('id', { ascending: true });
  
    if (error) {
      console.error('Error fetching challenges:', error);
    } else {
      setChallenges(data);
    }
  }

  function showAnswer(challenge) {
    alert(`Answer for challenge No. ${challenge.id} is ${challenge.answer}`);
  }

  const filteredChallenges = challenges.filter(challenge =>
    challenge.id.toString().includes(searchNumber)
  );

  const today = new Date().toISOString().split('T')[0];

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
          <li key={challenge.id} className="list-group-item mb-2">
            <div className="row">
              <div className="col-md-8">
                {challenge.date} – No. {challenge.id}
              </div>
              <div className="col-md-4 text-right">
                <Link to={`/challenge/${challenge.id}`} className="btn btn-primary btn-sm me-2">
                  Take this Challenge
                </Link>
                {challenge.date !== today && (
                  <button className="btn btn-secondary btn-sm" onClick={() => showAnswer(challenge)}>
                    Show Answer
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PreviousChallenges;
