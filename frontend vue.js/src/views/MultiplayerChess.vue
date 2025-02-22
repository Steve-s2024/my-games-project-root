<template>
  <div id="contentWrapper">
    <div id="content">
      <ChessGameHeader
      v-model="chess.currSide"
      :chess="chess"
      @shiftTextQueue="[]"
      :auth="{undo:false, textQueue:false}"
      />
      <KeyboardComp
      @keyboardBlocksLoaded="LoadKeyboardBlocks"
      :WIDTH="8"
      :HEIGHT="8"
      :KEYBOARD="chess.keyboard"
      :clickBlock="clickBlcok"
      :imgsObj="
        {
        whitepawn: '/imgs/chess/whitePawn.png',
        whiterook: '/imgs/chess/whiteRook.png',
        whiteknight: '/imgs/chess/whiteKnight.png',
        whitebishop: '/imgs/chess/whiteBishop.png',
        whitequeen: '/imgs/chess/whiteQueen.png',
        whiteking: '/imgs/chess/whiteKing.png',
        blackpawn: '/imgs/chess/blackPawn.png',
        blackrook: '/imgs/chess/blackRook.png',
        blackknight: '/imgs/chess/blackKnight.png',
        blackbishop: '/imgs/chess/blackBishop.png',
        blackqueen: '/imgs/chess/blackQueen.png',
        blackking: '/imgs/chess/blackKing.png'
      }
      "
      />
      <ChessBottomBar
      :toggleConfigPannel="toggleConfigPannel"
      :showConfigurePannel="showConfigurePannel"
      :startNewGame="startNewGame"
      />
    </div>
    <GameResultPannel
    v-if="showResultPannel"
    :gameResults="gameResults"
    />
    <ChessGameConfig
    :saveGame="saveGame"
    v-if="showConfigurePannel"
    />

  </div>
  <MessageWindow
  :messageType="messageType"
  :message="message"
  :showMessage="showMessage"
  />
</template>
<script>
import KeyboardComp from '@/components/KeyboardComp.vue'
import ChessGameHeader from '@/components/ChessGameHeader.vue'
import GameResultPannel from '@/components/GameResultPannel.vue'
import chessLayouts from '@/assets/js/chess/chessLayouts.json'
import { Chess } from '@/assets/js/chess/chessClasses.js'
import { TimeFormat } from '@/assets/js/generalClasses/timeFormat'
import axios from 'axios'
import ChessGameConfig from '@/components/ChessGameConfig.vue'
import MessageWindow from '@/components/MessageWindow.vue'

import io from 'socket.io-client'
import ChessBottomBar from '@/components/ChessBottomBar.vue'

export default {
  name: 'ChessGame',
  components: {
    KeyboardComp,
    ChessGameHeader,
    GameResultPannel,
    ChessGameConfig,
    MessageWindow,
    ChessBottomBar
  },
  data () {
    return {
      chess: new Chess(),
      KEY_BOARD_BLOCKS: [],
      gameResults: {
        time: 0,
        winner: 'unknown'
      },
      showResultPannel: false,
      showConfigurePannel: false,

      messageType: '',
      message: '',
      showMessage: false,

      socket: null,
      userSide: ''
    }
  },
  async mounted () {
    // console.log('chess game is mounted')
    this.chessLayouts = chessLayouts
    if (this.chess.status === 'pending') {
      this.currLayout = this.chessLayouts[0]
      // add the saved games to the available layouts
      this.chess.initChessGame(this.currLayout)
    }
    // console.log('chess game is inititalized')

    // the method handles everything that the device need to communicate with the server and oponent
    this.doInteractionWithServer()
  },
  methods: {
    LoadKeyboardBlocks (KEY_BOARD_BLOCKS) {
      this.KEY_BOARD_BLOCKS = KEY_BOARD_BLOCKS
    },
    clickBlcok (coor) {
      const move = [[this.chess.currPiece, coor]]
      // console.log(this.chess.currSide, this.userSide)
      if (this.chess.currSide !== this.userSide) return // check if it is the user's turn to make move
      if (this.chess.status === 'ended') return // chek if the game already ended
      const [row, col] = coor
      const keyboard = this.chess.keyboard
      const currPiece = this.chess.currPiece
      const piece = keyboard[row][col]
      if (currPiece != null && currPiece.side !== this.chess.currSide) {
        // console.log(`the current side is not ${currPiece.side}`)
        this.chess.textQueue.push(`the current side is not ${currPiece.side}`)
        this.removeHighLight(currPiece)
        this.chess.currPiece = null
      } else if (currPiece == null && piece == null) {
        // console.log('void click')
      } else if (currPiece == null && piece != null) {
        // console.log('the player want to select a piece')
        this.addHighLight(piece)
        this.chess.currPiece = piece
      } else if (currPiece != null && piece == null) {
        // console.log('the player want to move the piece')
        // make chess move
        const curCoor = JSON.parse(JSON.stringify(this.chess.currPiece.coordinate)) // take deep copy of the coordinate of current piece before the move
        if (this.chess.makeChessMove(move)) {
          this.socket.emit('makeMove', JSON.stringify([curCoor, coor])) // sync the move to the server, and to the other user
          this.chess.currPiece = null // remove the highlight effect
        }
      } else if (currPiece != null && piece != null) {
        const curCoor = JSON.parse(JSON.stringify(this.chess.currPiece.coordinate)) // take deep copy of the coordinate of current piece before the move
        // console.log('the player want to select a second piece')
        if (currPiece === piece) {
          // console.log('the two selected pieces are the same')
          this.removeHighLight(this.chess.currPiece)
          this.chess.currPiece = null
        } else if (currPiece.side === piece.side) {
          // console.log('the two selected piece are of the same side')
          this.removeHighLight(this.chess.currPiece)
          this.chess.currPiece = piece
          this.addHighLight(this.chess.currPiece)
        } else if (this.chess.makeChessMove(move)) {
          // make a chess move
          this.socket.emit('makeMove', JSON.stringify([curCoor, coor])) // sync the move to the server, and to the other user
          this.chess.currPiece = null // remove the highlight effect
        }
      }
      if (this.chess.status === 'ended') {
        this.endTheGame()
      }
    },
    addHighLight (piece) {
      const [row, col] = piece.coordinate
      const pieceElement = this.KEY_BOARD_BLOCKS[row][col].firstElementChild
      if (pieceElement !== undefined) {
        pieceElement.classList.add('highlighted')
      }
    },
    removeHighLight (piece) {
      const [row, col] = piece.coordinate
      const pieceElement = this.KEY_BOARD_BLOCKS[row][col].firstElementChild
      if (pieceElement) {
        pieceElement.classList.remove('highlighted')
      }
    },
    generateResults () {
      this.gameResults.time = TimeFormat.formatBySecond(this.chess.gameTime)
      this.gameResults.winner = this.chess.winner + ' side'
    },
    async saveGame (n, s, d) {
      // console.log('start saving game to local hardisk')
      const l = this.generateLayout()
      await axios.post('http://localhost:3000/saveChessGame', {
        name: n,
        side: s,
        difficulty: d,
        layout: l
      })
        .then(res => {
          console.log('game saved successfully!')
        })
      // console.log('game saved to local hard disk, disyplay the message window')
      this.showMessageWindow('new game saved to local hard disk!', 'regular')
      // console.log('configure pannel will close now')
      this.toggleConfigPannel()
    },
    generateLayout () {
      const layout = []
      const keyboard = this.chess.keyboard
      for (let r = 0; r < keyboard.length; r++) {
        for (let c = 0; c < keyboard[r].length; c++) {
          const piece = keyboard[r][c]
          if (piece != null) {
            const tmp = [
              piece.side,
              piece.coordinate,
              piece.name
            ]
            layout.push(tmp)
          }
        }
      }
      return layout
    },
    toggleConfigPannel () {
      this.showConfigurePannel = !this.showConfigurePannel
    },
    restart () {
      this.showResultPannel = false
      this.chess.initChessGame(this.currLayout)
    },
    endTheGame () {
      this.showResultPannel = true
      this.generateResults()
    },
    startNewGame () {
      console.log('starting new game')
    },
    showMessageWindow (message, type) {
      this.message = message
      this.messageType = type
      this.showMessage = true
      setTimeout(() => {
        this.showMessage = false
      }, 2000)
    },
    doInteractionWithServer () {
      // init the local socket for connecting to the server
      this.socket = io('http://192.168.2.15:3000', {
        auth: {
          authentication: 'this message is for authentication purpose!'
        },
        query: {
          param1: 'stephen'
        }
      })
      this.socket.emit('joinRoom')
      this.socket.on('playerJoined', numOfPlayer => {
        console.log(`a palyer has joined the room, the room has ${numOfPlayer} players now`)
      })
      this.socket.on('roomFull', message => {
        // console.log(message)
        this.showMessageWindow(message, 'warning')
      })
      this.socket.on('gameStart', message => {
        // console.log(message)
        this.showMessageWindow(message, 'regular')
      })
      this.socket.on('initGame', gameData => {
        // console.log(gameData)
        this.currLayout = gameData.layout
        this.userSide = gameData.userSide
        this.restart()
      })
      this.socket.on('moveMade', move => {
        move = JSON.parse(move)
        // console.log('this is the move i received: ', move)
        const [row, col] = move[0]
        // console.log(row, col, this.chess.keyboard[row][col])
        const piece = this.chess.keyboard[row][col]
        this.chess.makeChessMove([[piece, move[1]]])
        if (this.chess.status === 'ended') {
          this.endTheGame()
        }
      })
      this.socket.on('playerLeft', message => { // warn that a player has left
        // console.log(message)
        this.showMessageWindow(message, 'warning')
      })
    }
  }
}
</script>
