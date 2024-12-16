import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ChessGame from '../views/ChessGame.vue'
import TypeingGame from '@/views/TypeingGame.vue'
import MineSweep from '@/views/MineSweep.vue'
const routes = [
  {
    path: '/homePage',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/ChessGame',
    name: 'ChessGame',
    component: ChessGame
  },
  {
    path: '/Typeinggame',
    name: 'TypingGame',
    component: TypeingGame
  },
  {
    path: '/MineSweep',
    name: 'MineSweep',
    component: MineSweep
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
