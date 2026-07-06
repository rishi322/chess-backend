// const WebSocket = require('ws');
// const port = 7070; // Set the desired port 
// const wss = new WebSocket.Server({ port });
// // Shared state of the to-do list 


// const games = [];

// ///{"gameid":"",moves:[{move1},{move2}]}

// let totalUser = 0;
// const mongoose = require('mongoose');
// const activeGames = require('./Models/active-games');
// const game = require('./Models/game');

// const dbUser = 'rishi';          // e.g. "rishi"
// const dbPass = 'Rishi@322002';          // e.g. "Rishi@322002"
// const dbName = '?appName=Cluster0' 
// const clusterHost = 'cluster0.m9jczur.mongodb.net';

// // encode credentials in case they have special chars
// const encodedUser = encodeURIComponent(dbUser || '');
// const encodedPass = encodeURIComponent(dbPass || '');

// // Example SRV URI with database name and recommended options
// const MONGO_URI = process.env.MONGODB_URI ||
//   `mongodb+srv://${encodedUser}:${encodedPass}@${clusterHost}/${dbName}?retryWrites=true&w=majority`;
//   mongoose.connect(MONGO_URI);
//   console.log('Connected to MongoDB');
// wss.on('listening', () => {
//     console.log(`WebSocket server is listening on port ${port}`);
// });
// wss.on('connection', ws => {
//     totalUser++;
//     wss.clients.forEach(client=>{
//         client.send(totalUser)
//     })
//     // Send the current to-do list to the newly connected client 
//     ws.send(totalUser);
//     console.log(totalUser)
  
//     ws.on('message',async (message) => {

//         const msg = JSON.parse(message)
//         console.log(msg)
//       if(msg.type == 'message'){
       
//           const parsedData = JSON.parse(message);
//           console.log(parsedData); // Log the entire parsed object
//           if (parsedData && parsedData.gameId !== undefined) {
//             const gameId = parsedData.gameId;
//             console.log('Game ID:', gameId);
//           } else {
//             console.error('Invalid or unexpected format in parsed JSON.');
//           }
      

//       }else if (msg.type == 'join'){
//         console.log(msg)
//         games.forEach(game=>{

//           wss.clients.forEach(client=>{
              
//          client.send(JSON.stringify([{type:'start',msg:msg.message,gameId:msg.gameId}]))
//           })

//         })
//       }else if(msg.type =='create'){
//         console.log(msg)
     
//         games.push({gameId: msg.message, moves: '',status:'created',player:1});
//         console.log('game created',games)
//         const acg = await activeGames.create({gameId: msg.message, moves: '',status:'created',player:1,creater:msg.creater,player2:''})

//         console.log(acg)
//       }else if(msg.type == 'moves'){

//         console.log('this is messgae')
//         const result = await game.find({gameId:msg.gameId});
       
//           game.create({gameId:msg.gameId,moves:msg.message,fenString:''})
          
        
//         wss.clients.forEach(client=>{
//           const mov = JSON.stringify(message)
//           console.log(msg.message)
          
//          client.send(JSON.stringify([{type:'move',msg:msg.message,gameId:msg.gameId}]))
//         })
//       }
//       else{
//         console.log('no type specified')
//       }
        
       
//     });
//     ws.on("moves",async(moves)=>{
//       console.log(moves)
//       console.log('this is moves')
//     })
//     ws.on('close', async() => {
//         totalUser--;
//         console.log(totalUser)
//         // On WebSocket disconnect, save the games array to the database
//         wss.clients.forEach(client=>{
//             client.send(totalUser)
//         })
//     })
// });

// app.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');

// ---------- CONFIG ----------
const PORT = 7070;

const dbUser = 'rishi';          // e.g. "rishi"
const dbPass = 'Rishi@322002';          // e.g. "Rishi@322002"
const dbName = '?appName=Cluster0' 
const clusterHost = 'cluster0.m9jczur.mongodb.net';

// encode credentials in case they have special chars
const encodedUser = encodeURIComponent(dbUser || '');
const encodedPass = encodeURIComponent(dbPass || '');

// Example SRV URI with database name and recommended options
const MONGO_URI = process.env.MONGODB_URI ||
  `mongodb+srv://${encodedUser}:${encodedPass}@${clusterHost}/${dbName}?retryWrites=true&w=majority`;

// ----------------------------

const app = express();
app.use(express.json());
app.use(cors()); // tighten origin in production if needed

// Basic HTTP route for health checks
app.get('/', (req, res) => res.send({ status: 'ok', ws: true }));

// Optional: simple Mongoose setup (only if MONGO_URI provided)
let ActiveGame, GameModel;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Mongo connect error:', err));

  const activeGameSchema = new mongoose.Schema({
    gameId: String,
    moves: String,
    status: String,
    player: Number,
    creater: String,
    player2: String,
    createdAt: { type: Date, default: Date.now }
  });
  ActiveGame = mongoose.model('ActiveGame', activeGameSchema);

  const gameSchema = new mongoose.Schema({
    gameId: String,
    moves: String,
    fenString: String,
    createdAt: { type: Date, default: Date.now }
  });
  GameModel = mongoose.model('Game', gameSchema);
}

// ---------- WebSocket server ----------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/*
  Data structures:
    - gameRooms: Map<gameId, Set<ws>>
    - ws.gameId & ws.userId are attached metadata on each connection
*/
const gameRooms = new Map();
let totalUsers = 0;

function safeSend(ws, obj) {
  try {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  } catch (e) { /* ignore send errors */ }
}

function broadcastToGame(gameId, payload, excludeWs = null) {
  const room = gameRooms.get(gameId);
  if (!room) return;
  const msg = JSON.stringify(payload);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(msg);
    }
  }
}

function broadcastAll(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

wss.on('connection', (ws, req) => {
  totalUsers++;
  ws.isAlive = true;
  ws.gameId = null;
  ws.userId = null;

  // Send updated user count to all clients
  broadcastAll({ type: 'userCount', count: totalUsers });

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      // ignore invalid JSON
      safeSend(ws, { type: 'error', message: 'invalid_json' });
      return;
    }

    switch (msg.type) {
      case 'create': {
        const gameId = msg.gameId || msg.message;
        if (!gameId) {
          safeSend(ws, { type: 'error', message: 'missing_gameId' });
          break;
        }
        if (!gameRooms.has(gameId)) gameRooms.set(gameId, new Set());
        gameRooms.get(gameId).add(ws);
        ws.gameId = gameId;
        ws.userId = msg.userId || msg.creater || null;

        // Persist active game (optional)
        if (ActiveGame) {
          try {
            await ActiveGame.create({
              gameId,
              moves: '',
              status: 'created',
              player: 1,
              creater: msg.creater || '',
              player2: ''
            });
          } catch (e) { console.error('activeGames create error', e); }
        }

        // Notify the room (and sender) that game started
        broadcastToGame(gameId, { type: 'start', msg: `Game ${gameId} created`, gameId });
        break;
      }

      case 'join': {
        const gameId = msg.gameId || msg.message;
        if (!gameId) {
          safeSend(ws, { type: 'error', message: 'missing_gameId' });
          break;
        }
        if (!gameRooms.has(gameId)) gameRooms.set(gameId, new Set());
        gameRooms.get(gameId).add(ws);
        ws.gameId = gameId;
        ws.userId = msg.userId || null;

        broadcastToGame(gameId, { type: 'playerJoined', user: ws.userId, gameId });
        break;
      }

      case 'moves': {
        const gameId = msg.gameId || (msg.payload && msg.payload.gameId);
        const moves = msg.message || (msg.payload && msg.payload.moves);
        const fen = msg.payload && msg.payload.fen || null;
        if (!gameId || !moves) {
          safeSend(ws, { type: 'error', message: 'missing_gameId_or_moves' });
          break;
        }

        // Persist the move (optional)
        if (GameModel) {
          try {
            await GameModel.create({ gameId, moves, fenString: fen || '' });
          } catch (e) { console.error('game create error', e); }
        }

        // Broadcast move to same game room (exclude sender to avoid double-apply)
        broadcastToGame(gameId, { type: 'move', gameId, msg: moves, from: msg.from, to: msg.to, fen }, ws);
        break;
      }

      case 'message': {
        const gameId = msg.gameId;
        if (gameId && gameRooms.has(gameId)) {
          broadcastToGame(gameId, { type: 'message', gameId, message: msg.message }, ws);
        } else {
          broadcastAll({ type: 'message', message: msg.message });
        }
        break;
      }

      default:
        safeSend(ws, { type: 'error', message: 'unknown_type' });
    }
  });

  ws.on('close', () => {
    totalUsers--;
    // Remove from its game room
    if (ws.gameId && gameRooms.has(ws.gameId)) {
      gameRooms.get(ws.gameId).delete(ws);
      if (gameRooms.get(ws.gameId).size === 0) gameRooms.delete(ws.gameId);
    }
    broadcastAll({ type: 'userCount', count: totalUsers });
  });
});

// Heartbeat to kill dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`HTTP+WS server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  wss.close();
  server.close();
  if (mongoose && mongoose.disconnect) mongoose.disconnect();
});
