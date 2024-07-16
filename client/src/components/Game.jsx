import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerList from './PlayerList';
import Narrator from './Narrator';

const Game = () => {
  const { roomId, userId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [mafiaTarget, setMafiaTarget] = useState('');
  const [policeGuess, setPoliceGuess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/room/${roomId}/${userId}`);
        
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
  }, [roomId, userId]);

  const handleNightAction = async () => {
    try {
      setLoading(true);
      const player = room.players.find(player => player._id === userId);
      if (!player) {
        setError('Player not found');
        return;
      }
      const response = await axios.post(`http://localhost:5000/api/night-action/${roomId}/${userId}`, {
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
      const response = await axios.post(`http://localhost:5000/api/vote/${roomId}`, {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!room) {
    return <div>Room not found</div>;
  }

  const player = room.players.find(player => player._id === userId);
  const isPlayerMafia = player.role === 'mafia';
  const isPlayerPolice = player.role === 'police';
  const isPlayerAlive = player.alive;

  return (
    <div>
      <h2>Room Code: {room.code}</h2>
      <h2>Player Name: {player.name}</h2>
      <Narrator phase={room.phase} />
      
      {room.gameStarted && room.phase === 'night' && isPlayerAlive && (
        <div>
          <h3>Night Phase</h3>
          {isPlayerMafia && (
            <div>
              <label>Mafia's Target:</label>
              <select value={mafiaTarget} onChange={(e) => setMafiaTarget(e.target.value)}>
                <option value="">Select a player to kill</option>
                {room.players.filter(player => player.alive && player.role !== 'mafia').map(player => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
            </div>
          )}
          {isPlayerPolice && (
            <div>
              <label>Police's Guess:</label>
              <select value={policeGuess} onChange={(e) => setPoliceGuess(e.target.value)}>
                <option value="">Select a player to guess</option>
                {room.players.filter(player => player.alive && player.role !== 'police').map(player => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
            </div>
          )}
          {!isPlayerMafia && !isPlayerPolice && (
            <div>
              <p>City is sleeping...</p>
            </div>
          )}
          {(isPlayerMafia || isPlayerPolice) && (
            <button onClick={handleNightAction}>Submit Night Actions</button>
          )}
        </div>
      )}
      {room.gameStarted && room.phase === 'day' && isPlayerAlive && (
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
