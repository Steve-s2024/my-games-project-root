<template>
    <MessageWindow
    :messageType="'warning'"
    :message="'the game name already exist!'"
    :showMessage="showMessage"
    />
    <div class="wrapper">
        <form>
            <div class="row">
              <label for="name">name:</label>
              <input type="text" id="gameName" required v-model="gameName" maxlength="50">
              <br><br>
            </div>

            <div class="row">
              <label for="side">side:</label>
              <select id="side" v-model="side">
                  <option value="white">white</option>
                  <option value="black">black</option>
              </select>
              <br><br>
            </div>

            <div class="row">
              <label for="difficulty">difficulty:</label>
              <input type="text" id="gameDifficulty" v-model="difficulty" maxlength="10">
              <br><br>
            </div>
        </form>
        <div id="buttonWrapper">
            <button id="saveGame" class="button" @click="save">save game</button>
        </div>
    </div>
</template>
<style src="@/assets/styles/ChessGameConfig.css" scoped></style>
<script>

import axios from 'axios'
import MessageWindow from './MessageWindow.vue'

export default {
  name: 'ChessgameConfig',
  props: ['saveGame'],
  components: {
    MessageWindow
  },
  data () {
    return {
      gameName: '',
      side: 'white',
      difficulty: 'easy',
      showMessage: false
    }
  },
  mounted () {
    const now = new Date()
    this.gameName = 'saved game -' + now.toLocaleTimeString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  },
  methods: {
    save () {
      // varify if name already exist
      axios.get('http://localhost:3000/getChessByName', {
        params: {
          name: this.gameName
        }
      })
        .then(res => {
          if (res.data.length > 0) {
            // console.log('name already exist')
            this.showMessage = true
            // console.log('message prompt, start the count down')
            setTimeout(() => {
              this.showMessage = false
            }, 3000)
          } else {
            // send out the save game request
            this.saveGame(this.gameName, this.side, this.difficulty)
          }
        })
    }
  }
}
</script>
