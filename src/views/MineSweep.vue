<template>
  <h1>mineSweep</h1>
  <div class="difficultyList">
    <div
    v-for="(psbiliy, difficulty, idx) in difficulties"
    :key="idx"
    @click.prevent="changeDifficulty(difficulty)"
    :class="'button ' + (psbiliy == possibility ? 'chosenButton' : '')"
    >
      {{ 'difficulty: ' + difficulty + ' | mine possibility: ' + psbiliy + '%' }}
    </div>
  </div>
  <div class="sizeList">
    <div
    v-for="(dmsion, name, idx) in sizes"
    :key="idx"
    @click.prevent="changeSize(dmsion)"
    :class="'button ' + (dmsion == dimension ? 'chosenButton' : '')"
    >
      {{ name + ' | ' + dmsion.height + ' * ' + dmsion.width }}
    </div>
  </div>
  <div id="mineSweepContentWrapper">
    <MineSweepBoard
    :HEIGHT="dimension.height"
    :WIDTH="dimension.width"
    :BOARD="mineSweep.BOARD"
    :clickBlock="clickBlock"
    />
  </div>
  <ButtomBar
  :restart="restart"
  :exit="exit"
  />
  <GameResultPannel
  v-if="showResultPannel"
  :gameResults="gameResults"
  />
</template>
<script>
import '../assets/mineSweep/mineSweep.css'
import { MineSweep } from '../assets/mineSweep/mineSweep.js'
import MineSweepBoard from '@/components/MineSweepBoard.vue'
import ButtomBar from '@/components/ButtomBar.vue'
import GameResultPannel from '@/components/GameResultPannel.vue'
import { TimeFormat } from '@/assets/generalClasses/timeFormat'
export default {
  name: 'MineSweep',
  components: {
    MineSweepBoard,
    ButtomBar,
    GameResultPannel
  },
  data () {
    return {
      dimension: {
        height: 10,
        width: 10
      },
      mineSweep: null,
      possibility: 10,
      difficulties: {
        hard: 30,
        medium: 20,
        easy: 10
      },
      sizes: {
        small: {
          height: 6,
          width: 6
        },
        medium: {
          height: 10,
          width: 10
        },
        big: {
          height: 15,
          width: 15
        }
      },
      doubleClickTimeOut: null,
      doubleClickCoor: [],
      gameResults: {
        result: 'unknown',
        time: 0,
        discovered: 0,
        'mines left': 0
      },
      showResultPannel: false
    }
  },
  created () {
    this.dimension = this.sizes.medium
    this.mineSweep = new MineSweep(this.dimension.height, this.dimension.width)
  },
  mounted () {
    this.possibility = this.difficulties.easy
    this.mineSweep.initMineSweep(this.possibility)
  },
  methods: {
    clickBlock (coor, typeOfClick) {
      if (this.mineSweep.status === 'ended') return

      if (
        this.doubleClickTimeOut !== null &&
        JSON.stringify(coor) === JSON.stringify(this.doubleClickCoor) &&
        typeOfClick === 'left'
      ) {
        clearTimeout(this.doubleClickTimeOut)
        this.doubleClickCoor = []
        this.doubleClickTimeOut = null
        this.mineSweep.spreadCell(coor)
      } else {
        if (typeOfClick === 'left') {
          this.doubleClickCoor = coor
          this.doubleClickTimeOut = setTimeout(() => {
            this.doubleClickCoor = []
            this.doubleClickTimeOut = null
          }, 400)
          this.mineSweep.openCell(coor)
        } else if (typeOfClick === 'right') {
          this.mineSweep.flagCell(coor)
        }
      }

      if (this.mineSweep.status === 'ended') {
        this.generateResults()
        this.showResultPannel = true
      }
    },
    generateResults () {
      this.gameResults.result = this.mineSweep.result
      this.gameResults.time = TimeFormat.formatBySecond(this.mineSweep.gameTime)
      this.gameResults.discovered =
        (this.mineSweep.openedCellNum /
        (this.mineSweep.HEIGHT * this.mineSweep.WIDTH)).toFixed(2) * 100 + '%'
      this.gameResults['mines left'] = this.mineSweep.mineNum - this.mineSweep.flagNum
    },
    changeDifficulty (difficulty) {
      if (this.difficulties[difficulty] !== this.possibility) {
        this.possibility = this.difficulties[difficulty]
        this.restart()
      }
    },
    changeSize (dimension) {
      if (JSON.stringify(this.dimension) !== JSON.stringify(this.sizes[dimension])) {
        this.dimension = dimension
        this.mineSweep.changeBoardSize(this.dimension.height, this.dimension.width)
        this.restart()
      }
    },
    restart () {
      this.showResultPannel = false
      this.mineSweep.initMineSweep(this.possibility)
    },
    exit () {
      this.$router.push('/HomePage')
    }
  }
}
</script>
