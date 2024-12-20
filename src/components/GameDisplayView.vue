<template>
  <div class="gameDisplayBlock">
    <h1 class="blockHeader">{{  title }}</h1>
    <div class="blockImageWrapper">
      <img :src="imagePath" :alt="title">
    </div>
    <div class="blockButtonWrapper">
      <div class="button" @click="clickFunction(title)">start</div>
    </div>
  </div>
</template>
<script>
import '../assets/styles/gameDisplayView.css'

export default {
  name: 'GameDisplay',
  props: ['title', 'imageSrc', 'clickFunction'],
  data () {
    return {
      imagePath: '',
      arrLen: 0,
      currIdx: 0,
      updateImgInterval: null
    }
  },
  created () {
    if (typeof this.imageSrc === 'string') {
      this.imagePath = this.imageSrc
    }
    if (Array.isArray(this.imageSrc)) {
      this.imagePath = this.imageSrc[0]
      this.arrLen = this.imageSrc.length
      this.updateImgInterval = setInterval(() => {
        this.currIdx++
        this.currIdx %= this.arrLen
        this.imagePath = this.imageSrc[this.currIdx]
      }, 4000)
    }
  },
  beforeUnmount () {
    clearInterval(this.updateImgInterval)
  }
}
</script>
