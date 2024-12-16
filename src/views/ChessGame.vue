<template>
  <div id="contentWrapper">
    <div id="content">
      <LayoutInfoBar
      :currLayout="currLayout"
      :chessLayouts="chessLayouts"
      :optLayout="optLayout"
      />
      <ChessGameHeader
      v-model="chess.currSide"
      :chess="chess"
      @shiftTextQueue="shiftTextQueue"
      />
      <KeyboardComp
      @keyboardBlocksLoaded="LoadKeyboardBlocks"
      :WIDTH="8"
      :HEIGHT="8"
      :KEYBOARD="chess.keyboard"
      :clickBlock="clickBlcok"
      />
      <ButtomBar
      :restart="restart"
      :exit="exit"
      />
    </div>
    <GameResultPannel
    v-if="showResultPannel"
    :gameResults="gameResults"
    />
  </div>
</template>
<script>
import KeyboardComp from '@/components/KeyboardComp.vue'
import ChessGameHeader from '@/components/ChessGameHeader.vue'
import ButtomBar from '@/components/ButtomBar.vue'
import GameResultPannel from '@/components/GameResultPannel.vue'
import LayoutInfoBar from '@/components/LayoutInfoBar.vue'
import chessLayouts from '@/assets/chess/chessLayouts.json'
import { Chess } from '@/assets/chess/chessClasses.js'
import { TimeFormat } from '@/assets/generalClasses/timeFormat'

export default {
  name: 'ChessGame',
  components: {
    KeyboardComp,
    ChessGameHeader,
    ButtomBar,
    GameResultPannel,
    LayoutInfoBar
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
      showResultPannel: false
    }
  },
  async mounted () {
    // console.log('chess game is mounted')
    this.chessLayouts = chessLayouts
    if (this.chess.status === 'pending') {
      this.currLayout = this.chessLayouts[0]
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
      if (this.chess.status === 'ended') {
        this.showResultPannel = true
        this.generateResults()
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
    exit () {
      this.$router.push('/HomePage')
    },
    restart () {
      this.showResultPannel = false
      this.chess.initChessGame(this.currLayout)
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
    }
  }
}
</script>
