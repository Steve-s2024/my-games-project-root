<template >
  <h1 id = "timer">{{ time }}</h1>
  <div id = "typingGameContent" @keydown="keyPressed" tabindex="0">
    <div id = "textWrapper">
      <div id = "textBackground" class = "overlap textBlock">
        <p
        :class="'charBlock ' + (idx > inputChars.length-1 ? '' : (inputChars[idx] == char ? 'green' : 'red'))"
        v-for="(char, idx) in refChars"
        :key="idx"
        >
          {{ char }}
        </p>
      </div>
    </div>
  </div>
  <GameResultPannel
  v-if="showResultPannel"
  :gameResults="gameResults"/>
  <ButtomBar
  :restart="restart"
  :exit="exit"/>
</template>
<script scoped>
import ButtomBar from '@/components/ButtomBar.vue'
import GameResultPannel from '@/components/GameResultPannel.vue'
import { TimeFormat } from '@/assets/js/generalClasses/timeFormat'
import paragraphs from '@/assets/typingGame/typingGameData.json'
import '../assets/typingGame/typingGame.css'

export default {
  name: 'typeingGame',
  components: {
    ButtomBar,
    GameResultPannel
  },
  mounted () {
    this.paragraphs = paragraphs
    this.initTypingGame()
  },
  data () {
    return {
      sentence: '',
      paragraphs: [],
      interval: null,
      inputChars: [],
      refChars: [],
      showResultPannel: false,
      time: 0,
      status: 'pending',
      gameResults: {
        time: 0,
        correctChar: 0,
        wrongChar: 0,
        accuracy: 0
      }
    }
  },
  methods: {
    initTypingGame () {
      const idx = Math.floor(Math.random() * this.paragraphs.length)
      this.sentence = this.paragraphs[idx].text
      this.status = 'pending'
      this.inputChars.length = 0
      this.refChars = this.sentence.split('')
      this.showResultPannel = false
      clearInterval(this.interval)
      this.time = 0
    },
    keyPressed (event) {
      if (this.status === 'ended') return
      else if (this.status === 'pending') this.startGame()

      const key = event.key
      if (key === 'Backspace') this.inputChars.pop()
      else if (key.length === 1) {
        this.inputChars.push(key)
      }
      if (this.inputChars.length === this.refChars.length) this.endGame()
    },
    startGame () {
      this.status = 'ongoing'
      this.interval = setInterval(() => {
        this.time++
      }, 1000)
    },
    endGame () {
      this.status = 'ended'
      this.generateResults()
      this.showResultPannel = true
      clearInterval(this.interval)
    },
    generateResults () {
      const len = this.refChars.length
      let correctChar = 0
      for (let idx = 0; idx < this.refChars.length; idx++) {
        if (this.refChars[idx] === this.inputChars[idx]) {
          correctChar++
        }
      }
      this.gameResults.time = TimeFormat.formatBySecond(this.time)
      this.gameResults.correctChar = correctChar
      this.gameResults.wrongChar = len - correctChar
      this.gameResults.accuracy = (correctChar / len).toFixed(2) * 100 + '%'
    },
    restart () {
      this.initTypingGame()
    },
    exit () {
      this.$router.push('/HomePage')
    }
  }
}
</script>
