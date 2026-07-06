// const express = require('express');
// const { exec } = require('child_process');

// const app = express();
// const PORT = 5000;

// app.use(express.json());
// const cors = require('cors');

// app.use(cors());

// app.post('/getMove', (req, res) => {
//     const fen = req.body.fen;
//     console.log(fen);

//     const stockfishPath = 'D:\\chess-bk\\new chess_project\\socket\\stockfish\\stockfish-windows-x86-64.exe';

//     const stockfishProcess = exec(`"${stockfishPath}"`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing Stockfish: ${error}`);
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }

//         const bestMove = stdout.trim();
//         console.log(bestMove);
//         res.json({ bestMove });
//     });

//     stockfishProcess.stdin.write('uci\n');
//     stockfishProcess.stdin.write('setoption name Skill Level value 20\n');
//     stockfishProcess.stdin.write(`position fen ${fen}\n`);
//     stockfishProcess.stdin.write('d\n');  // Display current board to check settings
//     stockfishProcess.stdin.write('go movetime 100000\n');
//     stockfishProcess.stdin.write('quit\n');
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
const cors = require('cors');
// Temporarily allow all for local testing
// app.use(cors());
app.use(cors({ origin: 'https://chess-front-sandy.vercel.app' }));

// default to relative binary in repo
const defaultStockfish = path.join('https://github.com/rishi322/chess-backend/blob/main/stockfish/stockfish-windows-x86-64.exe');
const stockfishPath = defaultStockfish;

app.post('/getMove', (req, res) => {
  const fen = req.body.fen;
  console.log('FEN:', fen);
  
  // spawn stockfish and stream commands to it
  const stockfishProcess = exec(`"${stockfishPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Stockfish error:', error, stderr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const bestMove = stdout.trim();
    console.log('Stockfish output:', bestMove);
    res.json({ bestMove });
  });

  // send UCI commands
  stockfishProcess.stdin.write('uci\n');
  stockfishProcess.stdin.write('setoption name Skill Level value 20\n');
  stockfishProcess.stdin.write(`position fen ${fen}\n`);
  stockfishProcess.stdin.write('d\n');
  stockfishProcess.stdin.write('go movetime 1000\n');
  stockfishProcess.stdin.write('quit\n');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});