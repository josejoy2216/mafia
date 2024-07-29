import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Lobby from './components/Lobby';
import Game from './components/Game';
// import MainGame from './components/MainGame/Game';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/lobby/:roomId/:userId" element={<Lobby />} /> {/* Ensure Lobby route is correct */}
        <Route path="/startgame/:roomId/:userId" element={<Game />} />
        {/* <Route path="/MainGame" element={<MainGame/>}>
        
        </Route> */}
      </Routes>
    </Router>
  );
}

export default App;
