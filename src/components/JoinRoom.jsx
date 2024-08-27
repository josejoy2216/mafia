import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './assets/css/JoinRoom.css'

const JoinRoom = () => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
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
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="join-main-page-1">
      <div className="join-main-page-2">

        <div className="join-room-container">
          <h2>Join Room</h2>
          <div className="join-room-text-enter">
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
          <button className='joinroom-button' onClick={handleJoinRoom}><h5>Join</h5></button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JoinRoom;
