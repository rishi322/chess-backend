const express = require('express');
const activeGames = require('../Models/active-games');
const game = require('../Models/game')
const router = express.Router();

router.get('/getGame', async (req, res) => {
    const gameId = req.query.gameId;

    const result = await game.find({ gameId: gameId }).sort({ timestamp: -1 }).limit(1)

    try {
        res.send(result[0].moves)
    } catch (e) {
        res.send(e)
    }


})
router.get('/getHistory', async (req, res) => {
    const games = await activeGames.find({
        $or: [
            { creater: req.query.uname },
            { player2: req.query.uname }
            // Add additional conditions inside the $or array if needed
        ]
    });

    res.send(games)
})
router.post("/joinGame", async (req, res) => {
    const gameid = req.body.gameId;
    console.log(gameid)
    console.log(req.body.player2)
    const result = await activeGames.find({ gameId: gameid })

    console.log('this is result')
    console.log(result)
    if (result[0]) {

        if (result[0].player2 == req.body.player2 || result[0].player2 == '' || result[0].creater == req.body.player2) {
            console.log('yeeee')
            result[0].player = 2;
            result[0].player2 = req.body.player2;
            console.log(result[0])
            const update = await activeGames.findByIdAndUpdate(result[0]._id, result[0])
            console.log(update)
            const chessboardData = [
                { row: 1, col: 1, piece: 'BR' },
                { row: 1, col: 2, piece: 'BP' },
                { row: 1, col: 7, piece: 'WP' },
                { row: 1, col: 8, piece: 'WR' },
                { row: 2, col: 1, piece: 'BN' },
                { row: 2, col: 2, piece: 'BP' },
                { row: 2, col: 7, piece: 'WP' },
                { row: 2, col: 8, piece: 'WN' },
                { row: 3, col: 1, piece: 'BB' },
                { row: 3, col: 2, piece: 'BP' },
                { row: 3, col: 7, piece: 'WP' },
                { row: 3, col: 8, piece: 'WB' },
                { row: 4, col: 1, piece: 'BQ' },
                { row: 4, col: 2, piece: 'BP' },
                { row: 4, col: 7, piece: 'WP' },
                { row: 4, col: 8, piece: 'WQ' },
                { row: 5, col: 1, piece: 'BK' },
                { row: 5, col: 2, piece: 'BP' },
                { row: 5, col: 7, piece: 'WP' },
                { row: 5, col: 8, piece: 'WK' },
                { row: 6, col: 1, piece: 'BB' },
                { row: 6, col: 2, piece: 'BP' },
                { row: 6, col: 7, piece: 'WP' },
                { row: 6, col: 8, piece: 'WB' },
                { row: 7, col: 1, piece: 'BN' },
                { row: 7, col: 2, piece: 'BP' },
                { row: 7, col: 7, piece: 'WP' },
                { row: 7, col: 8, piece: 'WN' },
                { row: 8, col: 1, piece: 'BR' },
                { row: 8, col: 2, piece: 'BP' },
                { row: 8, col: 7, piece: 'WP' },
                { row: 8, col: 8, piece: 'WR' },
              ];
              
            const setBoard = await game.create({ gameId: gameid, moves: JSON.stringify(chessboardData), fenString: '' })
            console.log(setBoard)
            res.send({ status: 1, message: "game found" })
        } else {
            res.send({ status: 0, message: "invalid game id" })
        }

    } else {
        res.send({ status: 0, message: "game not found" })
    }
})

module.exports = router;