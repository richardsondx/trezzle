import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <Link className="navbar-brand" to="/">
        🏴‍☠️ Trezzle
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link className="nav-link" to="/">Today's Challenge</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/previous">Previous Challenges</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/how-to-play">How to Play</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
