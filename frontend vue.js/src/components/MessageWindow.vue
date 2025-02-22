<template>
  <div class="messageWrapper" id="messageWindow">
    {{ message }}
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
      this.toggleVisibility()
    },
    messageType (newVal, oldVal) {
      console.log(newVal, oldVal)
      if (oldVal !== '') {
        this.messageWindow.classList.remove(oldVal)
      }
      if (newVal !== '') {
        console.log(newVal)
        this.messageWindow.classList.add(newVal)
      }
    }
  },
  mounted () {
    this.messageWindow = document.getElementById('messageWindow')
    if (this.messageType !== '') {
      this.messageWindow.classList.add(this.messageType)
    }
    this.toggleVisibility()
  },
  methods: {
    toggleVisibility () {
      // console.log(`showMessage changed from ${oldVal} to ${newVal}`)
      if (this.showMessage === false) {
        this.messageWindow.classList.add('hidden')
      } else {
        this.messageWindow.classList.remove('hidden')
      }
    }
  }
}
</script>
