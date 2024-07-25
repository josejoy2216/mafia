import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket'; // Import the socket instance

function Lobby() {
  const { roomId, userId } = useParams();
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [hostId, setHostId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoomAndPlayers = async () => {
      try {
        const url = `https://humble-contentment-production.up.railway.app/api/lobby/${roomId}/${userId}`;
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
      await axios.post(`https://humble-contentment-production.up.railway.app/api/startgame/${roomId}/${userId}`);
      socket.emit('startGame', roomId);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const endGame = async () => {
    try {
      console.log('game Ended');
      await axios.delete(`https://humble-contentment-production.up.railway.app/api/endgame/${roomId}`);
      socket.emit('endGame', roomId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const exitGame = async () => {
    try {
      console.log('exiting game');
      await axios.delete(`https://humble-contentment-production.up.railway.app/api/exitgame/${roomId}/${userId}`);
      socket.emit('exitGame', roomId, userId);
      navigate('/');
    } catch (error) {
      console.error('Error exiting game:', error);
    }
  };

  return (
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
        <button onClick={startGame}>Start Game</button>
      )}
      {userId === hostId && (
        <button onClick={endGame}>End Game</button>
      )}
      {userId !== hostId && (
        <>
        <h3>Waiting for the host to start the game..... </h3>
        <button onClick={exitGame}>Exit Game</button>
        </>
      )}
    </div>
  );
}

export default Lobby;
