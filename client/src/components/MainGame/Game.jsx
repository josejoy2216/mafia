import React from 'react'
import Sidebar from './Sidebar'
import './css/game.css'

const Game = () => {
  return (
    <div className="maingame-layout mt-3">
    <div className="container">
      <div className="row">
        <div className="col-md-3">
          <br />
          <Sidebar/>
        </div>
        <div className="col-md-9">
          <br />
          <>
          <p>HELLO</p>
          </>
        </div>
      </div>
    </div>
  </div>
  )
}

export default Game