const WebSocket = require('ws');
const port = 7070; // Set the desired port 
const wss = new WebSocket.Server({ port });
// Shared state of the to-do list 


const games = [];

///{"gameid":"",moves:[{move1},{move2}]}

let totalUser = 0;
const mongoose = require('mongoose');
const activeGames = require('./Models/active-games');
const game = require('./Models/game');

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
  mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${port}`);
});
wss.on('connection', ws => {
    totalUser++;
    wss.clients.forEach(client=>{
        client.send(totalUser)
    })
    // Send the current to-do list to the newly connected client 
    ws.send(totalUser);
    console.log(totalUser)
  
    ws.on('message',async (message) => {

        const msg = JSON.parse(message)
        console.log(msg)
      if(msg.type == 'message'){
       
          const parsedData = JSON.parse(message);
          console.log(parsedData); // Log the entire parsed object
          if (parsedData && parsedData.gameId !== undefined) {
            const gameId = parsedData.gameId;
            console.log('Game ID:', gameId);
          } else {
            console.error('Invalid or unexpected format in parsed JSON.');
          }
      

      }else if (msg.type == 'join'){
        console.log(msg)
        games.forEach(game=>{

          wss.clients.forEach(client=>{
              
         client.send(JSON.stringify([{type:'start',msg:msg.message,gameId:msg.gameId}]))
          })

        })
      }else if(msg.type =='create'){
        console.log(msg)
     
        games.push({gameId: msg.message, moves: '',status:'created',player:1});
        console.log('game created',games)
        const acg = await activeGames.create({gameId: msg.message, moves: '',status:'created',player:1,creater:msg.creater,player2:''})

        console.log(acg)
      }else if(msg.type == 'moves'){

        console.log('this is messgae')
        const result = await game.find({gameId:msg.gameId});
       
          game.create({gameId:msg.gameId,moves:msg.message,fenString:''})
          
        
        wss.clients.forEach(client=>{
          const mov = JSON.stringify(message)
          console.log(msg.message)
          
         client.send(JSON.stringify([{type:'move',msg:msg.message,gameId:msg.gameId}]))
        })
      }
      else{
        console.log('no type specified')
      }
        
       
    });
    ws.on("moves",async(moves)=>{
      console.log(moves)
      console.log('this is moves')
    })
    ws.on('close', async() => {
        totalUser--;
        console.log(totalUser)
        // On WebSocket disconnect, save the games array to the database
        wss.clients.forEach(client=>{
            client.send(totalUser)
        })
    })
});


