import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PlayerList from './PlayerList';
import Narrator from './Narrator';

const Game = ({ roomCode, playerName }) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [mafiaTarget, setMafiaTarget] = useState('');
  const [policeGuess, setPoliceGuess] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/room/${roomCode}`);
        setRoom(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching room:', error);
        setError(error.response?.data?.message || 'Failed to fetch room details');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomCode]);

  const handleStartGame = async () => {
    try {
      setLoading(true);
      await axios.post(`http://localhost:5000/api/start-game/${roomCode}`);
      const response = await axios.get(`http://localhost:5000/api/room/${roomCode}`);
      setRoom(response.data);
      setError(null);
    } catch (error) {
      console.error('Error starting game:', error);
      setError(error.response?.data?.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleNightAction = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/api/night-action/${roomCode}/${room.players.find(player => player.name === playerName)._id}`, {
        mafiaTarget,
        policeGuess
      });
      setRoom(response.data.room);
      if (response.data.gameOver) {
        setError('Game Over! ' + (response.data.policeCorrect ? 'Police win!' : 'Mafia win!'));
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Error performing night action:', error);
      setError(error.response?.data?.message || 'Failed to perform night action');
    } finally {
      setLoading(false);
    }
  };

  const handleNominate = (playerId) => {
    setNominations((prevNominations) =>
      prevNominations.includes(playerId)
        ? prevNominations.filter((id) => id !== playerId)
        : [...prevNominations, playerId]
    );
  };

  const handleVote = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/api/vote/${roomCode}`, {
        playerName: nominations[0]
      });
      setRoom(response.data);
      setNominations([]);
    } catch (error) {
      console.error('Error during voting:', error);
      setError(error.response?.data?.message || 'Failed to perform voting');
    } finally {
      setLoading(false);
    }
  };

  if (!room || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const canStartGame = room.players.length >= 4;

  return (
    <div>
      <h2>Room Code: {room.code}</h2>
      <Narrator phase={room.phase} />
      {!room.gameStarted && (
        <div>
          <h3>Players in Lobby:</h3>
          <ul>
            {room.players.map((player) => (
              <li key={player.name}>{player.name}</li>
            ))}
          </ul>
          {canStartGame && (
            <button onClick={handleStartGame}>Start Game</button>
          )}
        </div>
      )}
      {room.gameStarted && room.phase === 'night' && (
        <div>
          <h3>Night Phase</h3>
          {room.players.find(player => player.name === playerName && player.role === 'mafia') && (
            <div>
              <label>Mafia's Target:</label>
              <select value={mafiaTarget} onChange={(e) => setMafiaTarget(e.target.value)}>
                <option value="">Select a player to kill</option>
                {room.players.filter(player => player.alive && player.role !== 'mafia').map(player => (
                  <option key={player.name} value={player.name}>{player.name}</option>
                ))}
              </select>
            </div>
          )}
          {room.players.find(player => player.name === playerName && player.role === 'police') && (
            <div>
              <label>Police's Guess:</label>
              <select value={policeGuess} onChange={(e) => setPoliceGuess(e.target.value)}>
                <option value="">Select a player to guess</option>
                {room.players.filter(player => player.alive && player.role !== 'police').map(player => (
                  <option key={player.name} value={player.name}>{player.name}</option>
                ))}
              </select>
            </div>
          )}
          {!room.players.find(player => player.name === playerName) && (
            <div>
              <p>City is sleeping...</p>
            </div>
          )}
          <button onClick={handleNightAction}>Submit Night Actions</button>
        </div>
      )}
      {room.gameStarted && room.phase === 'day' && (
        <div>
          <h3>Day Phase</h3>
          <p>Discuss and vote on who you think the mafia is!</p>
          <PlayerList
            players={room.players.filter(player => player.alive)}
            nominations={nominations}
            onNominate={handleNominate}
          />
          <button onClick={handleVote}>Vote</button>
        </div>
      )}
    </div>
  );
};

export default Game;
