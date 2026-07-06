const mongoose = require('mongoose')

const {Schema} = mongoose;

const acGames= new Schema({
    gameId: {
        type:String
    },
    moves:{
        tyep:String
    },status:{
        type:String
    },player:{
        type:Number
    },creater:{
        type:String
    },player2:{
        type:String
    }
})

const activeGames = mongoose.model('active-game',acGames);

module.exports = activeGames;
