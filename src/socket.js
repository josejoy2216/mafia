import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  cors: {
    origin: '*',
  },
});

export default socket;
