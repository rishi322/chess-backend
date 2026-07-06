// const express = require('express')
// const app = express();
// const cors = require('cors')
// const mongoose = require('mongoose')

// mongoose.connect("mongodb://localhost:27017/chess-db").then(console.log('connected'))
// app.use(express.urlencoded({extended:false}))
// app.use(express.json());

// app.use(cors())
// app.use('/games',require('./Routes/games'))


// app.use('/User',require('./Routes/user'));

// app.get('/',(req,res)=>{

//   console.log('this is home')
// })

// app.listen(3000,()=>{
//   console.log('server is listening on port 3000')
// })



// // app.js
// require('dotenv').config(); // optional for local development
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: 'https://chess-front-sandy.vercel.app',  }));

// Build DB URI safely
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

// Connect to MongoDB, then start server
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI, {
  // useNewUrlParser / useUnifiedTopology are now default in recent mongoose versions,
  // but you can include options if needed
})
  .then(() => {
    console.log('Connected to MongoDB');
    // only start HTTP server after DB is connected
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // fail fast in production, or handle reconnection
  });

// routes
app.use('/games', require('./Routes/games'));
app.use('/User', require('./Routes/user'));

app.get('/', (req, res) => {
  res.send('this is home');
});