import React from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <nav className="nav-container">
        <div className="logo">EV Hub</div>
        <ul className="nav-links">
          <Link to={"/home"}>Home</Link>
          <Link to={"/about"}>About us</Link>
          <Link to={"/contact"}>Contact</Link>
        </ul>
      </nav>
    </header>
  );
};

export default Header;