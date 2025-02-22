require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// for the socket io server
const {Server} = require('socket.io')

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'games_db',
    password: 'S434567056s$',
    port: 5432
});         



//1
app.post('/saveChessGame', async (req, res) => {
    console.log('API executed, start sending insert request!')
    const {name, side, difficulty, layout} = req.body
    await pool.query(`
                insert into chessGame(name, side, difficulty, layout)
                values($1, $2, $3, $4::jsonb)
            `, 
            [name, side, difficulty, JSON.stringify(layout)]
        )
    res.send('chess game saved')
})

//2
app.get('/getChessGame', async (req, res) => {
    const result = await pool.query('select name, side, difficulty, layout from chessGame')
    res.json(result.rows)
})

//3
app.delete('/delChessGame', async (req, res) => {
    const {gameName} = req.body
    console.log('about to delete the game:' + gameName)
    await pool.query(`
        delete from chessGame
        where name = $1
        `,
        [gameName]
    )
    res.send('chess game deleted')
})

//4 
app.get('/getChessByName', async (req, res) => {
    const {name} = req.query
    console.log('start searching the game by name: ' + name)
    const result = await pool.query(`
            select name from chessGame
            where name = $1        
        `,
        [name]
    )
    res.json(result.rows)
})


//end of database back end
const expressSever = app.listen(3000, () => {
    console.log('server running on port 3000')
})

//start of socket.io back end
const io = new Server(expressSever, {
    cors: [
        'http://localhost:3000',
    ]
})

// maintain the info of room and the players inside rooms
const rooms = new Map()
const users = new Map()
let count = 1
const chessLayouts = require('./public/assets/chess/chessLayouts.json') // import the chess layouts for multiplayer chess


function joinRoom (socket, roomId) {
    const room = io.sockets.adapter.rooms.get(roomId)
    const numOfPlayer = room ? room.size : 0
    // join the room
    socket.join(roomId)
    io.to(roomId).emit('playerJoined', numOfPlayer + 1)
    // store the room info into the rooms Map
    const roomArr = rooms.get(roomId)
    rooms.set(roomId, roomArr ? roomArr.concat([socket]) : [socket])
    users.set(socket.id, roomId)

    
    if (numOfPlayer + 1 == 2) {
        // if there are two players, start the game immediately
        io.to(roomId).emit('gameStart', 'the game start now')
        startGame(roomId)
    }
}

function startGame(roomId) {
    const room = rooms.get(roomId)
    const l = chessLayouts[0]
    room[0].emit('initGame', {userSide: 'white', layout: l})
    room[1].emit('initGame', {userSide: 'black', layout: l})
    
    room[0].on('makeMove', move => { // listen for new move 
        room[1].emit('moveMade', move) // let the other player know the new move
    }) 
    room[1].on('makeMove', move => { // listen for new move 
        room[0].emit('moveMade', move) // let the other player know the new move
    })
}

io.on('connection', socket => {
    console.log('user ', socket.id, ' has just joined the server')

    socket.on('joinRoom', () => {
        let joined = false
        for (let [roomId, room] of rooms) {
            if (room.length < 2) {
                joinRoom(socket, roomId)
                joined = true
                break
            }
        }
        // create the new room
        if (joined == false) {
            joinRoom(socket, 'room'+count)
            count += 1
        }
    })

    socket.on('disconnect', () => {
        console.log('a user disconnected')
        const roomId = users.get(socket.id)
        // console.log(roomId)
        const room = rooms.get(roomId)
        rooms.set(roomId, room.filter(soc => soc.id !== socket.id))
        users.delete(socket.id)
        io.to(roomId).emit('playerLeft', `player ${socket.id} has left the game!`)
    })
})

