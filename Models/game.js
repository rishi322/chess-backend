const mongoose = require('mongoose')

const {Schema} = mongoose;

const gameSchema = new mongoose.Schema({
    gameId:{
        type:String
    },
    moves:{
        type:String
    },
    
    fenString:{
        type:String,
        required:false
    },
    timestamp: { type: Date, default: Date.now }
})

const game = mongoose.model("game",gameSchema);
module.exports = game;