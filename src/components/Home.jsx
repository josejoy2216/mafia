// Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to Mafia Game</h1>
      <button onClick={() => navigate('/create-room')}>Create Room</button>
      <button onClick={() => navigate('/join-room')}>Join Room</button>
    </div>
  );
};

export default Home;


// import React from 'react';
// import { Link } from 'react-router-dom';

// const Home = () => {
//   return (
//     <div>
//       <h1>Home Page</h1>
//       <Link to="/create-room">Create Room</Link>
//       <Link to="/join-room">Join Room</Link>
//     </div>
//   );
// };

// export default Home;
