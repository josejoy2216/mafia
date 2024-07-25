// Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to Mafia Game</h1>
      <button onClick={() => navigate('/create-room')}>Create Room</button>
      <button onClick={() => navigate('/join-room')}>Join Room</button>
    </div>
  );
};

export default Home;