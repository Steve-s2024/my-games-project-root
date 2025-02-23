<template>
  <div class="chatBoxWrapper">
    <button class="button" id="toggleChatBox" @click="toggleChatBox">{{ showChatBox ? 'close' : 'open chat' }}</button>
    <div class="contentWrapper" v-show="showChatBox">
      <div id="roomInfo">
        <div id="roomId">room id: {{ roomId }}</div> |
        <div id="numOfUser">user online: {{ numOfUser }}</div>
      </div>
      <div id="messagesWrapper">
      </div>
      <div class="buttomBar">
        <input placeholder="chat here" v-model="message" @keypress.enter="postMessage"/>
        <button id="postMessaghe" @click="postMessage">send</button>
      </div>
    </div>
  </div>
</template>
<script>
import io from 'socket.io-client'
import '@/assets/styles/chatBox.css' // import the scoped css file. it will not contiminate other file's style

export default {
  name: 'ChatBox',
  data () {
    return {
      texts: [],
      socket: null,
      message: '',
      messagesWrapper: null,
      showChatBox: false,
      roomId: 'not room',
      numOfUser: 0
    }
  },
  props: {
    oldSocket: {
      require: false
    },
    oldRoomId: {
      required: false
    }
  },
  watch: {
    oldRoomId (oldVal, newVal) {
      this.roomId = newVal
    }
  },
  mounted () {
    this.messagesWrapper = document.getElementById('messagesWrapper') // init the div that contains the messages
    if (this.oldSocket === undefined) {
      this.socket = io('http://192.168.2.15:3000') // connect to the server, and join room if not already
    } else {
      this.socket = this.oldSocket
    }
    if (this.oldRoomId !== undefined) {
      this.roomId = this.oldRoomId
    }
    this.doInteractionWithServer()
  },
  methods: {
    doInteractionWithServer () {
      this.socket.emit('joinChatRoom', this.roomId)
      this.socket.on('chatRoomInfo', data => { // init the number of user using the chatbox
        const { numOfUser, roomId } = JSON.parse(data)
        // console.log('you have joined a room!', numOfUser)
        this.roomId = roomId
        this.numOfUser = numOfUser
      })
      this.socket.on('chatUserJoined', data => {
        const { userId, numOfUser } = JSON.parse(data)
        // console.log(`user ${userId} has joined the room`)
        this.numOfUser = numOfUser
        const message = `user ${userId} has joined the room`
        this.addMessage(message, 'headsupMessage')
      })
      this.socket.on('chatUserLeft', data => { // update the number of user information
        const { userId, numOfUser } = JSON.parse(data)
        // console.log(`user ${userId} has left the room`)
        this.numOfUser = numOfUser
        const message = `user ${userId} has left the room`
        this.addMessage(message, 'warningMessage')
      })
      this.socket.on('newMessage', data => { // show the new message inside the chat box
        const { user, message } = JSON.parse(data)
        const m = user + ': ' + message
        const type = 'regularMessage'
        this.addMessage(m, type)
      })
    },
    postMessage () {
      if (this.message !== '') {
        this.socket.emit('postMessage', this.message)
        this.message = ''
      }
    },
    toggleChatBox () {
      this.showChatBox = !this.showChatBox
    },
    addMessage (message, type) {
      const messageDiv = document.createElement('div')
      messageDiv.classList.add('messageDiv')
      messageDiv.classList.add(type)
      messageDiv.innerHTML = message
      this.messagesWrapper.appendChild(messageDiv)
      this.scrollToBottom()
    },
    scrollToBottom () {
      this.messagesWrapper.scrollTop = this.messagesWrapper.scrollHeight
    }
  }
}
</script>
