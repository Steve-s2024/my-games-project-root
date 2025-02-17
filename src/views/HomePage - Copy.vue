<template>
  <GameDisplayView
  v-for="(game, idx) in games"
  :key="idx"
  :title="game.title"
  :image-src="game.imageSrc"
  :click-function="startGame"
  />
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
          imageSrc: '/imgs/ChessGame.jpg'
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
        default:
          path = '/'
      }
      this.$router.push(path)
    }
  }
}
</script>
