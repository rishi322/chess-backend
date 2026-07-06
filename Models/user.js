const mongoose = require('mongoose')
const {Schema} = mongoose;

const userSchema = new Schema({
    userName:{
        type:String
    },
    email:{
        type:String,
        
    },
    password:{
        type:String
    }
})

const User = mongoose.model('user',userSchema)

module.exports = User;