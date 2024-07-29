import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [mafiaActionCompleted, setMafiaActionCompleted] = useState(false);
  const [policeActionCompleted, setPoliceActionCompleted] = useState(false);
  const [winMessage, setWinMessage] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const navigate = useNavigate();

  const getApiBaseUrl = () => {
    return process.env.REACT_APP_API_BASE_URL;
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${getApiBaseUrl()}/api/room/${roomId}/${userId}`);
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

    socket.on('gameStateUpdate', fetchRoom);

    socket.on('policeWinMessage', (message) => {
      fetchRoom();
      setWinMessage(`${message.policeName} won the game!`);
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

  const handleMafiaNightAction = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${getApiBaseUrl()}/api/night-action/mafia/${roomId}/${userId}`, { mafiaTarget });
      setRoom(response.data.room);
      setMafiaActionCompleted(true);
      socket.emit('gameStateUpdate', roomId);
      setError('Night action completed');
      console.log("Mafia action completed:", response.data.room);
    } catch (error) {
      console.error('Error performing mafia night action:', error);
      setError(error.response?.data?.message || 'Failed to perform night action');
    } finally {
      setLoading(false);
    }
  };

  const handlePoliceNightAction = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${getApiBaseUrl()}/api/night-action/police/${roomId}/${userId}`, { policeGuess });
      setRoom(response.data.room);
      setPoliceActionCompleted(true);
      socket.emit('gameStateUpdate', roomId);
      setError('Night action completed');
      console.log("Police action completed:", response.data.room);
    } catch (error) {
      console.error('Error performing police night action:', error);
      setError(error.response?.data?.message || 'Failed to perform night action');
    } finally {
      setLoading(false);
    }
  };

  const handleNominate = async (playerId) => {
    setNominations((prevNominations) => prevNominations.includes(playerId) ? [] : [playerId]);
    try {
      await axios.post(`${getApiBaseUrl()}/api/nominate/${roomId}`, {
        nominatedPlayerId: playerId,
        voterId: userId
      });
      socket.emit('gameStateUpdate', roomId);
    } catch (error) {
      console.error('Error during nomination:', error);
      setError(error.response?.data?.message || 'Failed to nominate player');
    }
  };

  const handleVote = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${getApiBaseUrl()}/api/vote/${roomId}`, {
        playerName: nominations[0] // Assuming only one nomination for simplicity
      });
      setRoom(response.data);
      setNominations([]);
      setError(null);
      socket.emit('gameStateUpdate', roomId);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const message = error.response.data.message;
        window.alert(message); // Display alert with the error message
        setAlertMessage(message); // Optionally set an alert message in state for UI feedback
      } else {
        console.error('An unexpected error occurred:', error);
        // Handle other unexpected errors
      }
    } finally {
      setLoading(false);
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

  const victim = () => {
    // Filter players who are dead
    const killedPlayer = room.players.find(player => player.status === "dead" && player.isAlive === false);

    // If a killed player is found, return their name
    if (killedPlayer) {
      return killedPlayer.name;
    } else {
      console.log("No killed player found.");
      return "Unknown";
    }
  };

  const winner = () => {
    const role = room.winner;
    const winners = room.players.filter((player) => player.role === role && player.isAlive === true);
    const winnerNames = winners.map((winner) => winner.name).join(', ');
    console.log('Winners:', winnerNames);
    return winnerNames;
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

  //const isPlayerAlive = player.isAlive;

  return (
    <div>
      <h2>Room Code: {room.code}
        {userId === hostId && (
          <button onClick={endGame}>End Game</button>
        )}
        {userId !== hostId && (
          <button onClick={exitGame}>Exit Game</button>
        )}
      </h2>
      <h2>Player Name: {player.name} - Votes: {player.votes.length}</h2>
      <h2>Player Role: {player.role}</h2>
      <Narrator phase={room.phase} />
      {winMessage && <h2>{winMessage}</h2>}
      {room.winner !== 'nowinner' && (
        <div>
          <p>Player: <b>{winner()}</b> won the game with role: <b>{room.winner}</b></p>
          <button onClick={endGame}>End Game</button>
        </div>
      )}

      {room.winner === 'nowinner' && room.phase === 'night' && (
        <div>
          <h2>Night Actions</h2>
          <p>City is sleeping...</p>
          {/* <h4>Mafia killed: {victim()}</h4> */}
          {isPlayerMafia && !mafiaActionCompleted && (
            <div>
              <h3>Choose a target</h3>
              <select value={mafiaTarget} onChange={(e) => setMafiaTarget(e.target.value)}>
                <option value=''>Select a player</option>
                {room.players.filter(player => player.isAlive && player._id !== userId).map((player) => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
              <button onClick={handleMafiaNightAction}>Confirm</button>
            </div>
          )}
          {isPlayerPolice && room.game.nightActions.mafiaTarget != null && !policeActionCompleted && (
            <div>
              <h3>Guess the mafia</h3>
              <select value={policeGuess} onChange={(e) => setPoliceGuess(e.target.value)}>
                <option value=''>Select a player</option>
                {room.players.filter(player => player.isAlive && player._id !== userId).map((player) => (
                  <option key={player._id} value={player._id}>{player.name}</option>
                ))}
              </select>
              <button onClick={handlePoliceNightAction}>Confirm</button>
            </div>
          )}
        </div>
      )}

      {room.winner === 'nowinner' && room.phase === 'day' && (
        <div>
          <h2>Day Phase</h2>
          <h4>Mafia killed: {victim()}</h4>
          {player.isAlive ? ( // Check if the current user is alive
            <>
              <p>Vote for a player:</p>
              <ul>
                {room.players
                  .filter((player) => player.isAlive && player._id !== userId) // Only show alive players except the current user
                  .map((player) => (
                    <li key={player._id}>
                      {player.name} - Votes: {player.votes.length}
                      {player.isAlive && (
                        <button onClick={() => handleNominate(player._id)}>
                          {nominations.includes(player._id) ? 'Remove Nomination' : 'Nominate'}
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <>
            <p>You are dead and cannot make nominations.</p>
            <ul>
            {room.players
              .filter((player) => player.isAlive && player._id !== userId) // Only show alive players except the current user
              .map((player) => (
                <li key={player._id}>
                  {player.name} - Votes: {player.votes.length}

                </li>
              ))}
          </ul>
          </>
          )}

          {userId === hostId && (
            //<button onClick={handleVote} disabled={nominations.length === 0}>Handle Vote</button>
            <button onClick={handleVote} >Handle Vote</button>
          )}
          
          {alertMessage && <div className="alert">{alertMessage}</div>}
        </div>
      )}
    </div>
  );
};

export default Game;
