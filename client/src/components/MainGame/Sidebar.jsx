import React from 'react'


const Sidebar = () => {
  return (
    <div className="Sidebar">
      <h2>
        MAFIA
      </h2>
      <hr />
      <div>
      <h4>Room Code: 43EDR45F
      {/* {userId === hostId && (
        <button onClick={endGame}>End Game</button>
      )} */}
      <button> End Game</button>
      </h4>
      <h4>Player Name:<b>Jose</b></h4>
      <h4>Player Role: <b>Police</b></h4>
      </div>
    </div>
  )
}

export default Sidebar