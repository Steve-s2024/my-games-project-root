require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const chessLayouts = require('./public/assets/chess/chessLayouts.json'); // import the chess layouts for multiplayer chess
const { disconnect } = require('process');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io on the created server
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});



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
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

// maintain the info of room and the players inside rooms
const chessRooms = new Map() // map chess room id --> chess room array
const chessPlayers = new Map() // map chess player --> chess room id
const chatRooms = new Map() // the chat room for chating
const chatUsers = new Map() // the chat users
let chessRoomCount = 1


function joinChessRoom (socket, chessRoomId) {
    let room = io.sockets.adapter.rooms.get(chessRoomId)
    const numOfPlayer = room ? room.size : 0
    // join the room
    socket.join(chessRoomId)
    room = io.sockets.adapter.rooms.get(chessRoomId) // reassign room if there weren't no room in the first assignment

    socket.emit('chessRoomInfo', JSON.stringify({
        numOfPlayer: room.size,
        roomId: chessRoomId
    }))
    io.to(chessRoomId).emit('playerJoined', numOfPlayer + 1)
    // store the room info into the rooms Map
    const roomArr = chessRooms.get(chessRoomId)
    chessRooms.set(chessRoomId, roomArr ? roomArr.concat([socket]) : [socket])
    chessPlayers.set(socket.id, chessRoomId)

    if (numOfPlayer + 1 == 2) {
        // if there are two players, start the game immediately
        io.to(chessRoomId).emit('gameStart', 'the game start now')
        startChessGame(chessRoomId)
    }
}

function startChessGame(chessRoomId) {
    const chessRoom = chessRooms.get(chessRoomId)
    const l = chessLayouts[0]
    chessRoom[0].emit('initGame', {userSide: 'white', layout: l})
    chessRoom[1].emit('initGame', {userSide: 'black', layout: l})
    
    chessRoom[0].on('makeMove', move => { // listen for new move 
        chessRoom[1].emit('moveMade', move) // let the other player know the new move
    }) 
    chessRoom[1].on('makeMove', move => { // listen for new move 
        chessRoom[0].emit('moveMade', move) // let the other player know the new move
    })

    chessRoom[0].on('promote', data => {
        chessRoom[1].emit('promteHappened', data)
    })
    chessRoom[1].on('promote', data => {
        chessRoom[0].emit('promteHappened', data)
    })
}

function disconnectFromChessRoom (socket) {
    const chessRoomId = chessPlayers.get(socket.id)
    // console.log(roomId)
    const chessRoom = chessRooms.get(chessRoomId)
    chessRooms.set(chessRoomId, chessRoom.filter(soc => soc.id !== socket.id))
    chessPlayers.delete(socket.id)
    const room = io.sockets.adapter.rooms.get(chessRoomId)
    if (room) { // only broadcast if the room still exist, since the room will be auto destroyed when the last user left it...
        io.to(chessRoomId).emit('playerLeft', JSON.stringify({
            message: `player ${socket.id} has left the game!`,
            numOfPlayer: room.size
        }))    
    }
    
}

function joinChatRoom(socket, chatRoomId) {
    if (chatRoomId != undefined) {
        socket.join(chatRoomId) // join the room

        /*
        below the m to m relationship between chat room and chat user is constructed by hash map. 
        one chat room can have many users
        and one user can belows to many chat rooms
        */
        if (chatRooms.get(chatRoomId) == undefined) {
            chatRooms.set(chatRoomId, new Map())
        }
        const chatRoom = chatRooms.get(chatRoomId)
        chatRoom.set(socket.id, socket)
        if (chatUsers.get(socket.id) == undefined) {
            chatUsers.set(socket.id, new Set())
        }
        const chatUser = chatUsers.get(socket.id)
        chatUser.add(chatRoomId)
        const room = io.sockets.adapter.rooms.get(chatRoomId)
        socket.emit('chatRoomInfo', JSON.stringify({
            numOfUser: room.size,
            roomId: chatRoomId
        }))
        io.to(chatRoomId).emit('chatUserJoined', JSON.stringify({
            userId: socket.id,
            numOfUser: room.size
        }))
        socket.on('postMessage', m => {
            // console.log(`user ${socket.id} sent this message: ${m}`)
            io.to(chatRoomId).emit('newMessage', JSON.stringify({
                user: socket.id,
                message: m
            }))
        })
    }
}

function disconnectFromChatRooms (socket) { // this method will handle disconnection to all the chat room the user belongs to. not a single room!
    const roomIds = chatUsers.get(socket.id)
    for (const roomId of roomIds) { // remove the user from all the chat rooms they belongs to.
        chatRooms.get(roomId).delete(socket.id)
        const room = io.sockets.adapter.rooms.get(roomId)
        if (room) {
            io.to(roomId).emit('chatUserLeft', JSON.stringify({
                userId: socket.id,
                numOfUser: room.size
            })) // broadcast the user have left this chat room
        }
    }
    chatUsers.delete(socket.id) // delete the user from the users hash map
}

io.on('connection', socket => {
    console.log('user ', socket.id, ' has just joined the server')

    socket.on('joinChessRoom', () => {
        let joined = false
        for (let [chessRoomId, chessRoom] of chessRooms) {
            if (chessRoom.length < 2) {
                joinChessRoom(socket, chessRoomId)
                joined = true
                break
            }
        }
        // create the new room
        if (joined == false) {
            joinChessRoom(socket, 'chess room'+chessRoomCount)
            chessRoomCount += 1
        }
    })

    socket.on('joinChatRoom', (chatRoomId) => {
        // console.log('the user want to join', chatRoomId)
        joinChatRoom(socket, chatRoomId)
    })

    socket.on('disconnect', () => {
        console.log('a user disconnected')
        if (chessPlayers.get(socket.id) != undefined) {
            disconnectFromChessRoom(socket) // call the method only after confirmed the socket is a chess player
        }
        if (chatUsers.get(socket.id) != undefined) {
            disconnectFromChatRooms(socket) // if the socket is a valid chat user, call the method to remove all information regard to the chat user.
        }
    })
})


