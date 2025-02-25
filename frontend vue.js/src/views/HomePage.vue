<template>
  <div class="gameViewsWrapper">
    <GameDisplayView
    v-for="(game, idx) in games"
    :key="idx"
    :title="game.title"
    :image-src="game.imageSrc"
    :click-function="startGame"
    />
  </div>
</template>
<script>
import GameDisplayView from '@/components/GameDisplayView.vue'

export default {
  name: 'HomePage',
  components: {
    GameDisplayView
  },
  data () {
    return {
      games: [
        {
          title: 'Chess',
          imageSrc: [
            '/imgs/chess01.png',
            '/imgs/chess02.png',
            '/imgs/chess03.png'
          ]
        },
        {
          title: 'Typing',
          imageSrc: '/imgs/TypingGame.jpg'
        },
        {
          title: 'MineSweep',
          imageSrc: '/imgs/MineSweep.jpg'
        },
        {
          title: 'BoxPhysics',
          imageSrc: [
            '/imgs/boxPhysics01.jpg',
            '/imgs/boxPhysics02.jpg',
            '/imgs/boxPhysics03.jpg',
            '/imgs/boxPhysics04.jpg'
          ]
        },
        {
          title: 'MultiplayerChess',
          imageSrc: [
            '/imgs/multiplayerChess01.png',
            '/imgs/multiplayerChess02.png'
          ]
        }
      ]
    }
  },
  methods: {
    startGame (title) {
      let path
      switch (title) {
        case 'Chess':
          path = '/ChessGame'
          break
        case 'Typing':
          path = '/TypingGame'
          break
        case 'MineSweep':
          path = '/MineSweep'
          break
        case 'BoxPhysics':
          path = '/BoxPhysics'
          break
        case 'MultiplayerChess':
          path = '/MultiplayerChess'
          break
        default:
          path = '/'
      }
      this.$router.push(path)
    }
  }
}
</script>
