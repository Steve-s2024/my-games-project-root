<template>
  <h1>move box game</h1>
  <div
  id="moveBoxGameFrame"
  @keydown="keyPressed"
  @keyup="keyLeft"
  tabindex="0"
  :style="frameSize">
    <div
    class="movableBox"
    v-for="(obstacle, idx) in moveBoxGame.obstacles" :key="idx"
    :style="`
      left: ${obstacle.box.coor[0]}px;
      top: ${obstacle.box.coor[1]}px;
      width: ${obstacle.box.size[0]}px;
      height: ${obstacle.box.size[1]}px;
    `"
    ></div>
    <div
    v-if="yourBox"
    id="yourBox"
    class="movableBox"
    :style="`
      left: ${yourBox.box.coor[0]}px;
      top: ${yourBox.box.coor[1]}px;
      width: ${yourBox.box.size[0]}px;
      height: ${yourBox.box.size[1]}px;
    `"
    ></div>
  </div>
  <div @click="moveBoxGame.addObstacle([parseInt(500 * Math.random()), 0], [20, 20])" class="button">add obstacle</div>
</template>
<script scoped>
import { MoveBoxGame } from '@/assets/js/boxClasses/moveBoxGame'
import '@/assets/styles/moveBoxGame.css'

export default {
  name: 'MoveBoxGame',
  data () {
    return {
      moveBoxGame: null,
      yourBox: null,
      updateVisualInterval: null,
      keyArr: [],
      lastKey: '',
      framePerSec: 30
    }
  },
  beforeUnmount () {
    this.moveBoxGame.clearUpdateInterval()
  },
  created () {
    this.moveBoxGame = new MoveBoxGame(undefined, undefined, this.framePerSec)
    this.moveBoxGame.createUpdateInterval()
    this.yourBox = this.moveBoxGame.movableBox
    this.updateVisual()
  },
  computed: {
    frameSize: {
      get () {
        return (`
          width: ${this.moveBoxGame.WIDTH}px; 
          height: ${this.moveBoxGame.HEIGHT}px;
        `)
      }
    }
  },
  methods: {
    keyPressed (event) {
      const key = event.key
      if (key === this.lastKey) return
      if (['a', 'd', 'w'].includes(key)) {
        if (['a', 'd'].includes(key)) {
          this.keyArr.push(key)
          if (key === 'a') this.moveBoxGame.speedUpHorizontally('l')
          if (key === 'd') this.moveBoxGame.speedUpHorizontally('r')
        } else {
          if (key === 'w') this.moveBoxGame.jump()
        }
      }
      this.lastKey = key
    },
    keyLeft (event) {
      const leftKey = event.key
      if (['a', 'd'].includes(leftKey)) {
        const topKey = this.keyArr[this.keyArr.length - 1]
        if (topKey === leftKey) {
          this.moveBoxGame.stopHorizontalSpeedUp()
        }
        this.keyArr.splice(this.keyArr.indexOf(leftKey), 1)
        if (this.keyArr.length !== 0) {
          this.keyPressed({ key: this.keyArr.pop() })
        }
      }
      this.lastKey = ''
    },
    updateVisual () {
      if (this.updateVisualInterval === null) {
        this.updateVisualInterval = setInterval(() => {
          if (this.yourBox) {
            this.yourBox.box.coor[0]++ // these two line of seemingly pointless code are neccesary for the vue to detect
            this.yourBox.box.coor[0]-- // the change in the coordinate of box
          }

          this.moveBoxGame.obstacles.forEach(obstacle => {
            obstacle.box.coor[0]++
            obstacle.box.coor[0]--
          })
        }, 1000 / this.framePerSec)
      }
    }
  }
}
</script>
