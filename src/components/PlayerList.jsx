import React from 'react';
import Player from './Player';

const PlayerList = ({ players, onNominate, nominations }) => {
  return (
    <div>
      <h2>Players</h2>
      <ul>
        {players.map((player) => (
          <Player
            key={player._id}
            player={player}
            onNominate={onNominate}
            isNominated={nominations.includes(player.name)} 
          />
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
