# Mafia Game Project

## Overview

This project is a multiplayer Mafia game where players can join from different devices using a unique game code. The game is designed to be played in real-time, with roles like Mafia, Police, and Civilians assigned to players. The game progresses through night and day phases, with players voting to identify the Mafia, and the game ends when a win condition is met.

## Features

### Room Creation
- **Host Creates Room:** The host starts the game by entering their name. A unique room code is generated by the server, which the host can share with other players to join the game.
- **MongoDB Integration:** Each player, including the host, is assigned a unique `_id` generated by MongoDB. This `_id` serves as the `userId` for all players.

### Joining a Room
- **Player Entry:** Players join an existing room by entering their name and the room code. They are added to the room's player list, with each player being assigned a unique `_id`.

### Game Start
- **Host Control:** Only the host has the ability to start the game.
- **Role Assignment:** The server randomly assigns roles (Mafia, Police, Civilian) to all players once the game starts.

### Game Phases
#### Night Phase
- **Civilian View:** Civilians are informed of the phase without revealing who the Mafia or Police are.
- **Mafia Action:** The Mafia selects a target to kill.
- **Police Action:** The Police guess whether a particular player is the Mafia.
- **Transition:** The game moves to the day phase after processing the actions, unless a win condition is met.

#### Day Phase
- **Voting:** All players vote on who they believe is the Mafia.
- **Outcome:** The player with the most votes is killed. The game then checks for win conditions:
  - If all Mafia members are dead, the City (Civilians and Police) wins.
  - If the Mafia outnumbers or equals the remaining Civilians, the Mafia wins.
- **Next Phase:** If no win condition is met, the game continues to the next night phase.

### Special Rules
1. **Role Distribution:** For every 6 or fewer players, only one Mafia is assigned.
2. **Room Code Usage:** Players use the room code instead of a room ID to join the game.
3. **Endgame Scenarios:**
   - When 3 players are left and one is Mafia, the Mafia wins if not correctly identified by the Police or Citizens.
   - Each player can vote only once per round.
4. **Night Actions:** During the night, only the Mafia can kill, and only after that can the Police guess the Mafia. The day phase starts after these actions are completed.
5. **Dead Players:** Killed players become spectators. They cannot vote but can view the ongoing game.
6. **Game End:** Once a winner is determined, the game displays the winner on all screens and deletes the game data from MongoDB.

## Game Logic and Implementation

### Room Creation Logic
- When the host creates a room, the server generates a unique room code and a MongoDB `_id` for the host. The room is initialized with the host's player information, and the room code is shared for other players to join.

### Joining a Room Logic
- Players provide their names and the room code. The server checks the validity of the room code and adds the player to the room's player list, assigning a MongoDB `_id`.

### Starting the Game Logic
- The host triggers the game start. The server then randomly assigns roles to all players and transitions the game into the night phase.

### Night Phase Logic
- **Mafia:** Only Mafia players can see and select a target to kill.
- **Police:** The Police are allowed to guess if a certain player is Mafia after the Mafia action is completed.
- **Civilian:** Civilians are informed that the city is asleep and must wait until the day phase.

### Day Phase Logic
- During the day phase, players deliberate and vote on who they believe the Mafia is. The player with the most votes is executed, and the game checks for win conditions.

### Game End Logic
- The game ends when a win condition is met (e.g., all Mafia are dead, or Mafia outnumbers Civilians). The server deletes all game data from MongoDB.

## Installation and Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/mafia-game.git
   ```

2. **Install Dependencies:**
   ```bash
   cd mafia-game
   npm install
   ```

3. **Set Up Environment Variables:**
   - Create a `.env` file and configure the MongoDB connection string, port, and any other necessary environment variables.

4. **Run the Server:**
   ```bash
   npm start
   ```

5. **Access the Game:**
   - The game will be available at `http://localhost:3000` in your browser.

## Contribution
Feel free to contribute by submitting issues or pull requests. Please ensure your code follows the project's coding standards and is well-documented.

## License
This project is licensed under the MIT License.

---

This README file outlines the core functionality and setup for the Mafia Game Project. It provides a comprehensive overview of how the game works, the logic behind each phase, and instructions on how to get the project up and running.