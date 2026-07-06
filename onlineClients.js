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

// mongoose.connect("mongodb://localhost:27017/chess-db").then(
//     console.log('connected')
// )

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
//       }else if(msg[0].type == 'moves'){

//         console.log('this is messgae')
//         const result = await game.find({gameId:msg[0].gameId});
       
//           game.create({gameId:msg[0].gameId,moves:msg[0].message,fenString:''})
          
        
//         wss.clients.forEach(client=>{
//           const mov = JSON.stringify(message)
//           console.log(msg[0].message)
          
//          client.send(JSON.stringify([{type:'move',msg:msg[0].message,gameId:msg[0].gameId}]))
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
// require('dotenv').config(); // optional for local dev (create .env with MONGODB_URI)
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');

const activeGames = require('./Models/active-games');
const GameModel = require('./Models/game'); // your game model

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Allow the frontend origin; change to your Netlify or custom domain
app.use(cors({ origin: 'https://chess-front-sandy.vercel.app/' }));

app.get('/', (req, res) => res.send('Socket service is running'));

// Build Mongo connection string (use MONGODB_URI directly if you prefer)

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

const PORT = process.env.PORT || 7070;

// Keep track of clients per game
const gameRooms = new Map(); // gameId => Set(ws)
let totalUsers = 0;

// Helper: broadcast to all clients in a game
function broadcastToGame(gameId, payload) {
  const clients = gameRooms.get(gameId);
  if (!clients) return;
  const str = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  }
}

// Helper: send to all connected clients (global)
function broadcastAll(payload) {
  const str = JSON.stringify(payload);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(str);
  });
}

// Simple heartbeat to detect dead clients
function noop() {}
function heartbeat() {
  this.isAlive = true;
}

// Connect to Mongo then start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const server = http.createServer(app);
    // Attach WebSocket to the existing HTTP server so single port is used
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      totalUsers++;
      ws.isAlive = true;
      ws.on('pong', heartbeat);

      // Optional: capture origin to enforce allowed origins
      // const origin = req.headers.origin;

      // Attach metadata
      ws.gameId = null;
      ws.userId = null;

      // Inform everyone of the new user count
      broadcastAll({ type: 'userCount', count: totalUsers });

      ws.on('message', async (raw) => {
        let msg;
        try {
          msg = JSON.parse(raw);
        } catch (err) {
          console.warn('Invalid JSON:', raw);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
          return;
        }

        // Basic message shape expected: { type: 'create'|'join'|'moves'|'message', ... }
        switch (msg.type) {
          case 'create': {
            const gameId = msg.gameId || msg.message;
            if (!gameId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing gameId' }));
              break;
            }
            // Add ws to room
            if (!gameRooms.has(gameId)) gameRooms.set(gameId, new Set());
            gameRooms.get(gameId).add(ws);
            ws.gameId = gameId;

            // Persist active game to DB (if desired)
            try {
              await activeGames.create({
                gameId,
                moves: '',
                status: 'created',
                player: 1,
                creater: msg.creater || '',
                player2: ''
              });
            } catch (err) {
              console.error('DB create activeGame failed', err);
            }

            // Notify room (or entire server if you want)
            broadcastToGame(gameId, { type: 'start', msg: `Game ${gameId} created`, gameId });
            break;
          }

          case 'join': {
            const gameId = msg.gameId || msg.message;
            if (!gameId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing gameId' }));
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
            // msg.payload could be { moves: [...], gameId: '...' }
            const payload = msg.payload || {};
            const gameId = payload.gameId || msg.gameId;
            const moves = payload.moves || msg.message;
            if (!gameId || !moves) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing gameId or moves' }));
              break;
            }

            // persist move(s) into Game collection
            try {
              await GameModel.create({ gameId, moves, fenString: payload.fen || '' });
            } catch (err) {
              console.error('DB create game move failed', err);
            }

            broadcastToGame(gameId, { type: 'move', msg: moves, gameId });
            break;
          }

          case 'message': {
            // Generic chat/message broadcast to the same game
            const gameId = msg.gameId;
            if (gameId) broadcastToGame(gameId, { type: 'message', msg: msg.message, gameId });
            else broadcastAll({ type: 'message', msg: msg.message });
            break;
          }

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown type' }));
        }
      });

      ws.on('close', () => {
        totalUsers--;
        // Remove ws from its game room
        if (ws.gameId && gameRooms.has(ws.gameId)) {
          gameRooms.get(ws.gameId).delete(ws);
          if (gameRooms.get(ws.gameId).size === 0) gameRooms.delete(ws.gameId);
        }
        broadcastAll({ type: 'userCount', count: totalUsers });
      });
    });

    // Heartbeat interval
    const interval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping(noop);
      });
    }, 30000);

    server.listen(PORT, () => console.log(`HTTP+WS server listening on port ${PORT}`));

    // Clean up on shutdown
    process.on('SIGTERM', () => {
      clearInterval(interval);
      wss.close();
      server.close();
      mongoose.disconnect();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
