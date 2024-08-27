import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket'; // Import the socket instance
import './assets/css/Lobby.css'

function Lobby() {
  const { roomId, userId } = useParams();
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [hostId, setHostId] = useState('');
  const navigate = useNavigate();

  const getApiBaseUrl = () => {
    return process.env.REACT_APP_API_BASE_URL;
  };

  useEffect(() => {
    const fetchRoomAndPlayers = async () => {
      try {
        const url = `${getApiBaseUrl()}/api/lobby/${roomId}/${userId}`;
        console.log(`Fetching data from: ${url}`);
        const response = await axios.get(url);
        setPlayers(response.data.players);
        setRoomCode(response.data.roomCode);
        setPlayerName(response.data.playerName);
        setHostId(response.data.hostId);
      } catch (error) {
        console.error('Error fetching room and players:', error);
      }
    };

    fetchRoomAndPlayers();

    socket.emit('joinRoom', roomId);

    socket.on('newPlayer', () => {
      fetchRoomAndPlayers();
    });

    socket.on('playerExited', (exitedPlayerId) => {
      setPlayers(prevPlayers => prevPlayers.filter(player => player._id !== exitedPlayerId));
    });

    socket.on('gameEnded', () => {
      navigate('/');
    });

    socket.on('gameStarted', () => {
      navigate(`/startgame/${roomId}/${userId}`);
    });

    return () => {
      socket.off('newPlayer');
      socket.off('playerExited');
      socket.off('gameEnded');
      socket.off('gameStarted');
    };
  }, [roomId, userId, navigate]);

  const startGame = async () => {
    try {
      await axios.post(`${getApiBaseUrl()}/api/startgame/${roomId}/${userId}`);
      socket.emit('startGame', roomId);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const endGame = async () => {
    try {
      console.log('game Ended');
      await axios.delete(`${getApiBaseUrl()}/api/endgame/${roomId}`);
      socket.emit('endGame', roomId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const exitGame = async () => {
    try {
      console.log('exiting game');
      await axios.delete(`${getApiBaseUrl()}/api/exitgame/${roomId}/${userId}`);
      socket.emit('exitGame', roomId, userId);
      navigate('/');
    } catch (error) {
      console.error('Error exiting game:', error);
    }
  };

  return (
    <div className="lobby-main-1">
      <div className="lobby-main-2">

      
    <div>
      <h1>Lobby</h1>
      <h2>Room Code: {roomCode}</h2>
      <h2>Player Name: {playerName}</h2>
      <h3>Players in this room:</h3>
      <ul>
        {players.map((player) => (
          <li key={player._id}>{player.name}</li>
        ))}
      </ul>
      {userId === hostId && players.length >= 4 && (
        <button className='lobby-button' onClick={startGame}>Start Game</button>
      )}
      {userId === hostId && (
        <button className='lobby-button' onClick={endGame}>End Game</button>
      )}
      {userId !== hostId && (
        <>
        <h3>Waiting for the host to start the game..... </h3>
        <button className='lobby-button' onClick={exitGame}>Exit Game</button>
        </>
      )}
    </div>
    </div>
    </div>
  );
}

export default Lobby;