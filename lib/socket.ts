import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 