import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JoinRoom = () => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');  
  const [alertMessage, setAlertMessage] = useState(null);
  const navigate = useNavigate();

  const getApiBaseUrl = () => {
    return process.env.REACT_APP_API_BASE_URL;
  };

  const handleJoinRoom = async () => {
    try {
      console.log(name, roomCode); // Logging entered name and room code
      const response = await axios.post(`${getApiBaseUrl()}/api/rooms/join`, { name, roomCode });
      const { roomId, playerId } = response.data;
      navigate(`/lobby/${roomId}/${playerId}`);
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message || 'An error occurred'; // Default message if none provided
        window.alert(message); // Display alert with the error message
        setAlertMessage(message); // Optionally set an alert message in state for UI feedback
      } else {
        console.error('An unexpected error occurred:', error);
        window.alert('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="join-room-container">
      <h2>Join Room</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <button onClick={handleJoinRoom}>Join</button>
    </div>
  );
};

export default JoinRoom;
