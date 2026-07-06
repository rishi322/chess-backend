const WebSocket = require('ws');
const port = 8080; // Set the desired port 
const wss = new WebSocket.Server({ port });
// Shared state of the to-do list 
let todos = ''

const game = require('./Models/game')

const express = require('express')
let totalUser = 0;
const mongoose = require('mongoose');
const games = [];
mongoose.connect("mongodb://localhost:27017/chess-db").then(
    console.log('connected')
)

wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${port}`);
});
wss.on('connection', ws => {
    totalUser++;
    // Send the current to-do list to the newly connected client 
    ws.send(JSON.stringify(todos));
    console.log(totalUser)
    ws.on('message',async (message) => {
        const receivedMessage = JSON.parse(message); 
    
        // Convert the message to a string 
        console.log(receivedMessage);
        if (receivedMessage === 'reset!*(@h9890138ch1908') {
            // Reset the to-do list 
            todos = ''
            
        } else {
            console.log(receivedMessage)
            // Add the new to-do item to the shared state 
            todos = receivedMessage;

            // const result = await game.create({fenString: todos})
            const g1 = new game({fenString: receivedMessage})
            g1.save();
            
        }
        // Broadcast the updated to-do list to all connected clients 
        wss.clients.forEach(client => {
            client.send(JSON.stringify(todos));
        });
    });
    ws.on('close', async() => {
        totalUser--;
        console.log(totalUser)
        // On WebSocket disconnect, save the games array to the database
        const gameSave = await game.create({fenString: JSON.stringify(games)});
    
        console.log(gameSave)
    })
});


