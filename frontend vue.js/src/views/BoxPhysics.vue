<template>
  <h1>box physics</h1>
  <div id="boxPhysicsWrapper">
    <div id="boxPhysicsContent">
      <div
      v-if="boxPhysics"
      id="boxPhysicsContainer"
      :style="`
      height: ${boxPhysics.height}px;
      width: ${boxPhysics.width}px;
      `"
      @keydown="keyPressed"
      @keyup="keyLeft"
      tabindex="0"
      >
        <div
        v-if="boxPhysics.box"
        id="mainBox"
        :style="`
        left: ${boxPhysics.box.box.coor[0]}px;
        top: ${boxPhysics.box.box.coor[1]}px;
        height: ${boxPhysics.box.box.size[0]}px;
        width: ${boxPhysics.box.box.size[1]}px;
        `"
        ></div>
        <div
        v-for="(box, idx) in boxPhysics.boxes"
        v-show="box !== boxPhysics.box"
        :key="idx"
        class="box"
        :style="`
        left: ${box.box.coor[0]}px;
        top: ${box.box.coor[1]}px;
        height: ${box.box.size[0]}px;
        width: ${box.box.size[1]}px;
        `"
        >{{ idx }}</div>
      </div>
      <div
      class="button"
      @click="addBox"
      >add box (E)</div>
      <div
      class="button"
      @click="boxPhysics.changeGravitationalForce"
      >inverse gravititional force (G)</div>
      <div
      class="button"
      @click="removeBox"
      >remove box (R)</div>
    </div>
  </div>

</template>
<script>
import { BoxPhysics } from '@/assets/js/boxPhysics/boxPhysics'
import '@/assets/styles/boxPhysics/boxPhysics.css'
export default {
  name: 'BoxPhysics',
  data () {
    return {
      keyArr: [],
      prevKey: '',
      boxPhysics: null,
      updateInterval: null,
      height: 500,
      width: 500,
      fps: 30
    }
  },
  created () {
    this.boxPhysics = new BoxPhysics(this.height, this.width, this.fps)
    this.boxPhysics.addMainBox()
    this.updateInterval = setInterval(() => {
      this.updateVisual()
    }, 1000 / this.fps)
    this.boxPhysics.createUpdateInterval()
  },
  beforeUnmount () {
    this.boxPhysics.clearUpdateInterval()
    clearInterval(this.updateInterval)
  },
  methods: {
    updateVisual () {
      this.boxPhysics.boxes.forEach(box => {
        box.box.coor[0]++
        box.box.coor[0]--
      })
    },
    keyPressed (event) {
      const key = event.key

      if (this.prevKey === key) return
      this.prevKey = key

      if (['a', 'd'].includes(key)) {
        this.keyArr.push(key)
        if (key === 'a') {
          this.boxPhysics.applyHorizontalAccel('l')
        }
        if (key === 'd') {
          this.boxPhysics.applyHorizontalAccel('r')
        }
      }
      if (key === 'w') {
        this.boxPhysics.jump()
      }
      if (key === 'e') {
        this.addBox()
      }
      if (key === 'g') {
        this.boxPhysics.changeGravitationalForce()
      }
      if (key === 'r') {
        this.boxPhysics.removeBox()
      }
      if (key === 'q') {
        this.boxPhysics.box.xVel += this.boxPhysics.box.xVel > 0 ? 300 : -300
      }
    },
    keyLeft (event) {
      const key = event.key
      if (key === this.prevKey) this.prevKey = ''
      if (['a', 'd'].includes(key)) {
        if (this.keyArr[this.keyArr.length - 1] === key) {
          this.boxPhysics.stopHorizontalAccel()
          this.keyArr.pop()
          if (this.keyArr.length) {
            this.keyPressed({ key: this.keyArr.pop() })
          }
        } else {
          this.keyArr.splice(this.keyArr.indexOf(key), 1)
        }
      }
    },
    addBox () {
      this.boxPhysics.addBox([(this.width - 20) * Math.random(), (this.height - 20) * Math.random()])
    },
    removeBox () {
      this.boxPhysics.removeBox()
    }
  }
}
</script>
