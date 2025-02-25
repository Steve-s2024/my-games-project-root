<template>
  <div id="contentHeader">
    <div id="turnSign">
      <p id="whiteTurnSign" :class="currSide == 'white' ? 'turnSignHighlighted' : ''"></p>
      <p id="blackTurnSign" :class="currSide == 'white' ? '' : 'turnSignHighlighted'"></p>
    </div>
    <div id="undo" class="button" @click="undoHistory" v-if="auth.undo">undo</div>
    <div id="textBox" v-if="auth.textQueue">
      <div v-for="(content, idx) in chess.textQueue" :key="idx">
        {{ content }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ChessGameHeader',
  props: ['modelValue', 'chess', 'auth'],
  computed: {
    currSide: {
      get () {
        return this.modelValue
      }
    }
  },
  mounted () {
    this.textInterval = setInterval(() => {
      this.removeText()
    }, 2000)
  },
  methods: {
    removeText () {
      if (this.chess.textQueue.length > 1) {
        this.$emit('shiftTextQueue', this.chess.textQueue)
      }
    },
    undoHistory () {
      this.chess.undoHistory()
      this.$emit('undoHistory')
    }
  }
}
</script>
