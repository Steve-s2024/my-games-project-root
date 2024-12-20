<template>
  <nav id="navBar">
    <router-link to="/">Home</router-link>
    <router-link to="/ChessGame">Chess</router-link>
    <router-link to="/TypingGame">Typing</router-link>
    <router-link to="/MineSweep">Mine Sweep</router-link>
    <router-link to="/BoxPhysics">Box Physics</router-link>
  </nav>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
