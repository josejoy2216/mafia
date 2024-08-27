import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './assets/css/CreateRoom.css'

const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL;
};

const CreateRoom = () => {
  const [hostName, setHostName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/rooms/create/`, { hostName });
      console.log('Response from create room:', response.data); // Log response for debugging
      //const { room, player } = response.data;
      const room = response.data;
      const player = room.players.find(p => p._id === room.host);
      if (room && player) {
        navigate(`/lobby/${room._id}/${player._id}`);
      } else {
        console.error('Invalid response structure:', response.data);
        // Handle unexpected response structure or missing data
      }
    } catch (error) {
      console.error('Error creating room:', error);
      // Handle Axios request error (network issue, server down, etc.)
    }
  };

  return (
    <div className="create-main-page-1">
      <div className="create-main-page-2">
        <div className="col-md-6 create-room-container">
          <h2>Create Room</h2>
          <div className='create-room-text-enter'>
          <input
            type="text"
            placeholder="Enter your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <button className='createroom-button' onClick={handleCreateRoom}><h5>Create</h5></button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
