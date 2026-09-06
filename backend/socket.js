// socket.js - Real-time Socket.IO Manager for CampusTrack
const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', '*'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client registration & room joining
    socket.on('register', (userData) => {
      if (!userData) return;
      socket.userData = userData;

      // Join user specific room
      if (userData.id) {
        socket.join(`user:${userData.id}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room user:${userData.id}`);
      }

      // Join role room
      if (userData.role) {
        socket.join(`role:${userData.role}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room role:${userData.role}`);
      }

      // Join department room if applicable
      if (userData.departmentName) {
        socket.join(`dept:${userData.departmentName}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room dept:${userData.departmentName}`);
      }
    });

    // Join specific issue room
    socket.on('join:issue', (issueId) => {
      if (issueId) {
        socket.join(`issue:${issueId.toUpperCase()}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room issue:${issueId}`);
      }
    });

    // Leave specific issue room
    socket.on('leave:issue', (issueId) => {
      if (issueId) {
        socket.leave(`issue:${issueId.toUpperCase()}`);
        console.log(`[Socket.IO] Socket ${socket.id} left room issue:${issueId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit an event to all or targeted rooms
 * @param {string} eventName - Name of the event (e.g., 'issue:created', 'issue:updated')
 * @param {object} payload - Data payload to broadcast
 * @param {string|string[]} [rooms] - Optional room(s) to target
 */
function emitSocketEvent(eventName, payload, rooms = null) {
  if (!io) {
    console.warn('[Socket.IO] Cannot emit event, io instance not initialized');
    return;
  }

  try {
    if (rooms) {
      if (Array.isArray(rooms)) {
        rooms.forEach((r) => io.to(r).emit(eventName, payload));
      } else {
        io.to(rooms).emit(eventName, payload);
      }
    } else {
      // Global broadcast
      io.emit(eventName, payload);
    }
    console.log(`[Socket.IO] Emitted '${eventName}' ${rooms ? `to ${JSON.stringify(rooms)}` : 'globally'}`);
  } catch (err) {
    console.error(`[Socket.IO] Error emitting event ${eventName}:`, err);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitSocketEvent
};
