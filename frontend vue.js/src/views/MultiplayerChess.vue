<template>
  <div id="contentWrapper">
    <div id="content">
      <div class="chessRoomInfo">
        <div class="chessRoomId">chess room: {{ roomId }}</div>
        <div class="numOfPlayer">player online: {{ numOfPlayer }}</div>
      </div>
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

  <!-- the v-if is necessary because you should only load and connect with chat room after you get the id of this chess room, otherwise there will be redundant room being created-->
  <ChatBox
  v-if="roomId"
  :oldSocket="socket"
  :oldRoomId="roomId"
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
import ChatBox from '@/components/ChatBox.vue'

export default {
  name: 'ChessGame',
  components: {
    KeyboardComp,
    ChessGameHeader,
    GameResultPannel,
    ChessGameConfig,
    MessageWindow,
    ChessBottomBar,
    ChatBox
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
      userSide: '',
      roomId: null,

      checkmatePiece: null,
      checkmateCoor: null
    }
  },
  watch: {
    checkmatePiece (newVal, oldVal) {
      // console.log(newVal, oldVal)
      if (newVal === oldVal) return
      /**
       * update the check mate effect according to the new checkmate piece
       */
      if (newVal === null) {
        const [r, c] = this.checkmateCoor
        const div = document.getElementById(r + ',' + c)
        div.classList.remove('warning')
        this.checkmateCoor = null
      } else {
        this.checkmateCoor = this.checkmatePiece.coordinate
        const [r, c] = this.checkmateCoor
        const div = document.getElementById(r + ',' + c)
        div.classList.add('warning')
      }
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
          if (this.checkIfPromote(coor)) {
            this.sendPromotionInfo(curCoor, coor) // hold the information if its a promotion, and use a different API to sync the other player
          } else {
            this.socket.emit('makeMove', JSON.stringify([curCoor, coor])) // sync the move to the server, and to the other user
          }
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
          if (this.checkIfPromote(coor)) {
            this.sendPromotionInfo(curCoor, coor) // hold the information if its a promotion, and use a different API to sync the other player
          } else {
            this.socket.emit('makeMove', JSON.stringify([curCoor, coor])) // sync the move to the server, and to the other user
          }
          this.chess.currPiece = null // remove the highlight effect
        }
      }

      setTimeout(() => {
        /*
        update the checkmate peice inorder to assign the checkmate effect (red warning background color)
        */
        this.updateCheckmatePiece()

        /**
         * the game is ended, generate and display the result
         */
        if (this.chess.status === 'ended') {
          this.showResultPannel = true
          this.generateResults()
        }
      }, 100)
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
    updateCheckmatePiece () {
      this.checkmatePiece = this.chess.checkmatePiece
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
      this.updateCheckmatePiece()
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
      /* use this when deploying, otherwise use the http://192.168.2.15 for development
      // init the local socket for connecting to the server
      this.socket = io('https://my-games-project-e2a91568bb20.herokuapp.com/', {
        withCredentials: true,
        transports: ['websocket'] // Try WebSocket first
      })
      */
      this.socket = io('http://192.168.2.15:3000', {
        withCredentials: true,
        transports: ['websocket'] // Try WebSocket first
      })

      this.socket.emit('joinChessRoom')
      this.socket.on('chessRoomInfo', data => {
        const { numOfPlayer, roomId } = JSON.parse(data)
        this.numOfPlayer = numOfPlayer
        this.roomId = roomId
      })
      this.socket.on('playerJoined', numOfPlayer => {
        // console.log(`a palyer has joined the room, the room has ${numOfPlayer} players now`)
        this.numOfPlayer = numOfPlayer
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
        this.updateCheckmatePiece()
        if (this.chess.status === 'ended') {
          this.endTheGame()
        }
      })
      this.socket.on('promoteHappened', data => { // handle auto promote when the other player promoted.
        const promoteInfo = JSON.parse(data)
        const { row, col } = promoteInfo[0]
        const piece = this.chess.keyboard[row][col]
        const newCoordinate = promoteInfo[1]
        const promoteType = promoteInfo[2]
        this.chess.promotion(piece, newCoordinate, promoteType)
      })
      this.socket.on('playerLeft', data => { // warn that a player has left
        // console.log(message)
        const { message, numOfPlayer } = JSON.parse(data)
        this.showMessageWindow(message, 'warning')
        this.numOfPlayer = numOfPlayer
      })
      this.socket.on('promotionInfo', data => {
        this.synchronizePromoteInfo(JSON.parse(data))
      })
    },
    checkIfPromote (newCoor) {
      const piece = this.chess.keyboard[newCoor[0]][newCoor[1]]
      const result = (
        (piece != null && piece.type === 'pawn') &&
        (
          (piece.side === 'white' && newCoor[0] === this.chess.KEYBOARD_HEIGHT - 1) ||
          (piece.side === 'black' && newCoor[0] === 0)
        )
      )
      if (result) {
        console.log('promotion happened')
      }
      return result
    },
    sendPromotionInfo (oldCoor, newCoor) {
      /*
      here i will send out the updated promotion information to the other player to instruct them of what type of piece to promote in the last move
      to learn the type of promotion, i need to wait for 100ms until the promotion have already happened.
      */
      setTimeout(() => {
        this.socket.emit('syncPromotion', JSON.stringify({
          type: this.chess.keyboard[newCoor[0]][newCoor[1]].type,
          coors: [oldCoor, newCoor]
        }))
      }, 100)
    },
    synchronizePromoteInfo (data) {
      /*
      here i handled the chess logic outside of the chess.js out of necessity, i need the information of promotion from the other player. and do the promotion without
      calling the promotion method inside chess.js. because that method will invoke the prompt, which should not show up to this player.
      */
      const { type, coors } = data
      // console.log(type, coors)

      const [oldCoor, newCoor] = coors
      const pawn = this.chess.keyboard[oldCoor[0]][oldCoor[1]]
      const moves = [[pawn, newCoor]]

      /*
      the code fragment below is directly copy from the makeChessMove method from chess.js. it has been trimmed out of the unnecessary codes.
      my job now is to reconstruct the pawn's move and prevent the prompt from apearing.
      */
      this.chess.textQueue.length = 0 // clear the text queue

      const moveLen = moves.length
      this.chess.moveRecord.push(moveLen)
      const [piece, coordinate] = moves[0]
      this.chess.loadMove(piece, coordinate)

      /*
      now, the move is loaded, I will replace the pawn with the actual promotion type intended.
      the code is copied from promotion method in chess.js. it is been adjusted to optimize efficiency
      */
      const side = piece.side
      this.chess.removeFromKeyboard(piece)
      this.chess.addPiece(side, coordinate, type)
      this.chess.varifyMoveByCheckmate()

      this.chess.changeSide() // change the side
    }
  }
}
</script>
