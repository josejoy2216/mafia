import React from 'react';

const Player = ({ player, onNominate, isNominated }) => {
  return (
    <li>
      {player.name} - {player.alive ? 'Alive' : 'Dead'}
      {player.alive && (
        <button onClick={() => onNominate(player._id)}>
          {isNominated ? 'Nominated' : 'Nominate'}
        </button>
      )}
    </li>
  );
};

export default Player;
