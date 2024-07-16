import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

function Lobby() {
  const { roomId, userId } = useParams();
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [hostId, setHostId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const fetchRoomAndPlayers = async () => {
      try {
        const url = `http://localhost:5000/api/lobby/${roomId}/${userId}`;
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

    newSocket.emit('joinRoom', roomId);

    newSocket.on('newPlayer', () => {
      fetchRoomAndPlayers();
    });

    newSocket.on('playerExited', (exitedPlayerId) => {
      setPlayers(prevPlayers => prevPlayers.filter(player => player._id !== exitedPlayerId));
    });

    newSocket.on('gameEnded', () => {
      navigate('/');
    });

    newSocket.on('gameStarted', () => {
      navigate(`/startgame/${roomId}/${userId}`);
    });

    return () => {
      newSocket.off('newPlayer');
      newSocket.off('playerExited');
      newSocket.off('gameEnded');
      newSocket.off('gameStarted');
      newSocket.disconnect();
    };
  }, [roomId, userId, navigate]);

  const startGame = async () => {
    try {
      await axios.post(`http://localhost:5000/api/startgame/${roomId}/${userId}`);
      socket.emit('startGame', roomId);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const endGame = async () => {
    try {
      console.log('game Ended');
      await axios.delete(`http://localhost:5000/api/endgame/${roomId}`);
      socket.emit('endGame', roomId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const exitGame = async () => {
    try {
      console.log('exiting game');
      await axios.delete(`http://localhost:5000/api/exitgame/${roomId}/${userId}`);
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
        <button onClick={exitGame}>Exit Game</button>
      )}
    </div>
  );
}

export default Lobby;
