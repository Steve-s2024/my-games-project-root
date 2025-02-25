<template>
  <div id="contentWrapper">
    <div id="content">
      <LayoutInfoBar
      :currLayout="currLayout"
      :chessLayouts="chessLayouts"
      :optLayout="optLayout"
      :deleteSavedGame="deleteSavedGame"
      />
      <ChessGameHeader
      v-model="chess.currSide"
      :chess="chess"
      @shiftTextQueue="shiftTextQueue"
      @undoHistory="updateCheckmatePiece"
      :auth="{undo:true, textQueue:true}"
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
      <ButtomBar
      :restart="restart"
      :exit="exit"
      />
      <button id="openConfigureGamePannel" class="button" :onclick="toggleConfigPannel">
        {{ showConfigurePannel ? 'close configrue game pannel' : 'open configure game pannel'  }}
      </button>
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
  v-show="showMessage"
  :messageType="'regular'"
  :message="'new game saved to local hard disk!'"
  :showMessage="showMessage"
  />
</template>
<script>
import KeyboardComp from '@/components/KeyboardComp.vue'
import ChessGameHeader from '@/components/ChessGameHeader.vue'
import ButtomBar from '@/components/ButtomBar.vue'
import GameResultPannel from '@/components/GameResultPannel.vue'
import LayoutInfoBar from '@/components/LayoutInfoBar.vue'
import chessLayouts from '@/assets/js/chess/chessLayouts.json'
import { Chess } from '@/assets/js/chess/chessClasses.js'
import { TimeFormat } from '@/assets/js/generalClasses/timeFormat'
import axios from 'axios'
import ChessGameConfig from '@/components/ChessGameConfig.vue'
import MessageWindow from '@/components/MessageWindow.vue'
import { setTimeout } from 'core-js'

export default {
  name: 'ChessGame',
  components: {
    KeyboardComp,
    ChessGameHeader,
    ButtomBar,
    GameResultPannel,
    LayoutInfoBar,
    ChessGameConfig,
    MessageWindow
  },
  data () {
    return {
      chess: new Chess(),
      KEY_BOARD_BLOCKS: [],
      chessLayouts: [],
      currLayout: {},
      gameResults: {
        time: 0,
        winner: 'unknown'
      },
      showResultPannel: false,
      showConfigurePannel: false,
      showMessage: false,

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
      this.getSavedGames()
      this.chess.initChessGame(this.currLayout)
    }
    // console.log('chess game is inititalized')
  },
  methods: {
    LoadKeyboardBlocks (KEY_BOARD_BLOCKS) {
      this.KEY_BOARD_BLOCKS = KEY_BOARD_BLOCKS
    },
    clickBlcok (coor) {
      if (this.chess.status === 'ended') return
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
        if (this.chess.makeChessMove([[this.chess.currPiece, coor]])) {
          this.chess.currPiece = null
        }
      } else if (currPiece != null && piece != null) {
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
        } else if (this.chess.makeChessMove([[this.chess.currPiece, coor]])) {
          // make a chess move
          this.chess.currPiece = null
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
    exit () {
      this.$router.push('/HomePage')
    },
    restart () {
      this.showResultPannel = false
      this.chess.initChessGame(this.currLayout)
      this.updateCheckmatePiece()
    },
    optLayout (idx) {
      this.showL = false
      this.currLayout = this.chessLayouts[idx]
      this.restart()
    },
    shiftTextQueue (textQueue) {
      textQueue.shift()
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
      this.showMessage = true
      setTimeout(() => {
        this.showMessage = false
      }, 2000)
      // console.log('configure pannel will close now')
      this.toggleConfigPannel()
      // console.log('layout pannel updating')
      this.getSavedGames()
    },
    async getSavedGames () {
      await axios.get('http://localhost:3000/getChessGame')
        .then(res => {
          console.log('saved games uploaded')
          this.chessLayouts = res.data.reverse().concat(chessLayouts)
        })
        .catch(err => {
          console.log(err)
        })
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
    deleteSavedGame (idx) {
      // console.log(idx)
      const gameName = this.chessLayouts[idx].name
      axios.delete('http://localhost:3000/delChessGame', {
        data: { gameName }
      })
        .then(res => {
          console.log('game deleted')
          this.chessLayouts.splice(idx, 1)
        })
        .catch(err => {
          console.log(err)
        })
    }
  }
}
</script>
