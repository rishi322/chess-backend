const express = require('express')

const router = express.Router();

const user = require('../Models/user')

router.get('/createUser',async(req,res)=>{


    const result = await user.create({
        userName:'deep',
        email:'deep@gmail.com',
        password:"123456"
    })

    res.send(result)
})

router.post('/verifyUser',async(req,res)=>{
    console.log('this is to verify the user')
    console.log(req.body)
    const email = req.body.email;
    const password = req.body.password;

    const result =await user.find({email: email});
    console.log(result)
    if(result[0]){

        
            if(result[0].password == password){
                ///successfull login
                res.send({status:"1",message:"success",data:result,response:"1"})
            }else{
                ///incorrect password
                
                res.send({status:"0",message:"failed",data:"password incorrect",response:"0"})
            }
       
    }else{
        res.send({status:"0",message:"failed",data:"email incorrect",response:"0"})
    }
    
    



})

router.get('/',async(req,res)=>{
    const result = await user.find({})
    res.send(result)
})

module.exports = router;