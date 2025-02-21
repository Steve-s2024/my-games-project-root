<template>
  <div class="messageWrapper" :id="messageType">
    {{ message }}
  </div>
</template>
<style scoped src="@/assets/styles/messageWindow.css"></style>
<script>
export default {
  name: 'MessageWindow',
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
    }
  },
  mounted () {
    this.toggleVisibility()
  },
  methods: {
    toggleVisibility () {
      const messageWrapper = document.getElementById(this.messageType)
      // console.log(`showMessage changed from ${oldVal} to ${newVal}`)
      if (this.showMessage === false) {
        messageWrapper.classList.add('hidden')
      } else {
        messageWrapper.classList.remove('hidden')
      }
    }
  }
}
</script>
