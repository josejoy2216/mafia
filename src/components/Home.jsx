// Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './assets/css/Home.css'
import createimg from './assets/images/create-2.jpeg'
import joinimg from './assets/images/players-join.png'
import mafialogo from './assets/images/mafia-logo-3.png'

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container main-div-1">
      {/* <div>
      <h1>Welcome to Mafia Game</h1>
      </div> */}

      <div className='col-md-12 col-sm-6 main-div-2'>
        <div className='create-component'>
          <img className='createimg' src={createimg} alt="" />
          <div onClick={() => navigate('/create-room')} className="caption-1">CREATE ROOM</div>

          {/* <button onClick={() => navigate('/create-room')}>Create Room</button> */}
        </div>
        <div className="mafia-logo">
          {/* <img className='mafia-logo-img' src={mafialogo} alt="" /> */}
          <div class="flip-container">
            <div class="flipper">
              <div class="front">
              <img className='mafia-logo-img' src={mafialogo} alt="" />
              </div>
              <div class="back">
              <img className='mafia-logo-img' src={mafialogo} alt="" />
              </div>
              <div class="clear"></div>
            </div>
            
          </div>
        </div>
        <div className='join-component'>
          <img className='joinimg' src={joinimg} alt="" />
          <div onClick={() => navigate('/join-room')} className="caption-1">JOIN ROOM</div>

          {/* <button onClick={() => navigate('/join-room')}>Join Room</button> */}
        </div>

      </div>







    </div>



  );
};

export default Home;