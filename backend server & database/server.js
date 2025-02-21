require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

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


//end
app.listen(3000, () => {
    console.log('server running on port 3000')
})