import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
//import PlayerList from './PlayerList';
import Narrator from './Narrator';
import socket from '../socket'; // Adjust the path if necessary

const Game = () => {
  const { roomId, userId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [mafiaTarget, setMafiaTarget] = useState('');
  const [policeGuess, setPoliceGuess] = useState('');
  const [hostId, setHostId] = useState('');
  const [nightActionCompleted, setNightActionCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/room/${roomId}/${userId}`);
        setRoom(response.data);
        setHostId(response.data.host);
        setError(null);
      } catch (error) {
        console.error('Error fetching room:', error);
        setError(error.response?.data?.message || 'Failed to fetch room details');
      } finally {
        setLoading(false);
      }
    };  

    fetchRoom();

    socket.emit('joinRoom', roomId);

    socket.on('gameStateUpdate', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('policeWinMessage', (message) => {
      // Handle displaying the message to all players
      console.log(message); // Replace with actual UI update logic
    });

    socket.on('gameEnded', () => {
      navigate('/');
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('policeWinMessage');
      socket.off('gameEnded');
    };
  }, [roomId, userId, navigate]);

  const handleNightAction = async () => {
    try {
      setLoading(true);
      const player = room.players.find(player => player._id === userId);
      if (!player) {
        setError('Player not found');
        return;
      }
  
      let action = {};
      if (player.role === 'mafia' && mafiaTarget) {
        action = {
          mafiaTarget,
          actionType: 'kill'
        };
      } else if (player.role === 'police' && policeGuess) {
        action = {
          policeGuess,
          actionType: 'guess'
        };
      } else {
        setError('Invalid action for current role or missing selection');
        return;
      }
      console.log(`night-action:${roomId}/${userId}`)
      const response = await axios.post(`http://localhost:5000/api/night-action/${roomId}/${userId}`, action);
      setRoom(response.data.room);
      setNightActionCompleted(true);
      socket.emit('gameStateUpdate', response.data.room);
  
      if (action.actionType === 'kill' && response.data.killedPlayer) {
        setError(`Mafia has killed ${response.data.killedPlayer.name}`);
      } else if (action.actionType === 'guess' && response.data.policeGuess) {
        setError(`Police guessed ${response.data.policeGuess.name}`);
      } else {
        setError('Night action completed');
      }
  
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
        playerName: nominations[0] // Assuming only one nomination for simplicity
      });
      setRoom(response.data);
      setNominations([]);
      setError(null);
    } catch (error) {
      console.error('Error during voting:', error);
      setError(error.response?.data?.message || 'Failed to perform voting');
    } finally {
      setLoading(false);
    }
  };

  const endGame = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/endgame/${roomId}`);
      socket.emit('endGame', roomId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const victim = () => {
    // Filter players who are dead
    const killedPlayer = room.players.find(player => player.status === "dead" && player.isAlive === false);
  
    // If a killed player is found, return their name
    if (killedPlayer) {
      console.log("Killed Player:", killedPlayer.name);
      return killedPlayer.name;
    } else {
      console.log("No killed player found.");
      return "Unknown";
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
  const isPlayerAlive = player.isAlive;

  return (
    <div>
      <h2>Room Code: {room.code}    
      {userId === hostId && (
        <button onClick={endGame}>End Game</button>
      )}
      </h2>
      <h2>Player Name: {player.name}</h2>
      <h2>Player Role: {player.role}</h2>

      
      <Narrator phase={room.phase} />
      
      {room.phase === 'night' && !nightActionCompleted && (
        <div>
          <h2>Night Actions</h2>
          <p>City is sleeping...</p>
          {isPlayerMafia && (
            <div>
              <h3>Choose a target</h3>
              <select value={mafiaTarget} onChange={(e) => setMafiaTarget(e.target.value)}>
                <option value=''>Select a player</option>
                {room.players.filter(player => player.isAlive && player._id !== userId).map((player) => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
              <button onClick={handleNightAction}>Confirm</button>
            </div>
          )}
          {isPlayerPolice && (
            <div>
              <h3>Guess the mafia</h3>
              <select value={policeGuess} onChange={(e) => setPoliceGuess(e.target.value)}>
                <option value=''>Select a player</option>
                {room.players.filter(player => player.isAlive && player._id !== userId).map((player) => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
              <button onClick={handleNightAction}>Confirm</button>
            </div>
          )}
        </div>
      )}
      {room.phase === 'day' && (
        <div>
          <h2>Day Phase</h2>
          <h4>mafia killed: {victim()}</h4>
          <p>Vote for a player:</p>
          <select value={nominations[0]} onChange={(e) => handleNominate(e.target.value)}>
            <option value=''>Select a player to vote</option>
            {room.players.filter(player => player.isAlive && player._id !== userId).map((player) => (
              <option key={player._id} value={player._id}>{player.name}</option>
            ))}
          </select>
          <button onClick={handleVote}>Vote</button>
        </div>
      )}
    </div>
  );
};

export default Game;
