

import { useState } from 'react';
import { Link } from 'react-router-dom';


const Home = () => {
  return (
    <div className="realestate-home">
      <header className="hero">
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#fff',
          textShadow: '0 2px 16px rgba(0,191,174,0.18)'
        }}>
          Couch2Castle
        </h1>
        <p style={{
          fontSize: '1.35rem',
          marginTop: '1.2rem',
          color: '#e0f7fa',
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
          textShadow: '0 1px 8px rgba(0,191,174,0.10)'
        }}>
          Couch2Castle is a modern real estate platform that helps you discover, filter, and schedule tours for your dream home.<br /><br />
          <span style={{color:'#b2dfdb'}}>Browse listings, view property details, and connect with agents—all in a sleek, easy-to-use interface designed for your next move.</span>
        </p>
      </header>
    </div>
  );
};

export default Home;
