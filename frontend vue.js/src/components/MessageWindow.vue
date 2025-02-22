<template>
  <div class="centeringWrapper">
    <div class="messageWrapper" id="messageWindow">
      {{ message }}
    </div>
  </div>
</template>
<style scoped src="@/assets/styles/messageWindow.css"></style>
<script>
export default {
  name: 'MessageWindow',
  data () {
    return {
      messageWindow: null
    }
  },
  props: {
    message: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      required: true
    },
    showMessage: {
      type: Boolean,
      required: true
    }
  },
  watch: {
    showMessage (newVal, oldVal) {
      setTimeout(() => { // for making the transition animation happen when v-if recreated the component
        this.toggleVisibility()
      }, 100)
    },
    messageType (newVal, oldVal) {
      // console.log(newVal, oldVal)
      if (oldVal !== '') {
        this.messageWindow.classList.remove(oldVal)
      }
      if (newVal !== '') {
        this.messageWindow.classList.add(newVal)
      }
    }
  },
  mounted () {
    this.messageWindow = document.getElementById('messageWindow')
    if (this.messageType !== '') {
      this.messageWindow.classList.add(this.messageType)
    }
  },
  methods: {
    toggleVisibility () {
      // console.log(`showMessage changed from ${oldVal} to ${newVal}`)
      if (this.showMessage === false) {
        this.messageWindow.classList.remove('show')
      } else {
        this.messageWindow.classList.add('show')
      }
    }
  }
}
</script>
