<template>
  <div class="barWrapper">
    <button id="openConfigureGamePannel" class="button" :onclick="toggleConfigPannel">
      {{ showConfigurePannel ? 'close configrue game pannel' : 'open configure game pannel'  }}
    </button>
    <button id="newGame" class="button" :onclick="startNewGame">
      new game
    </button>
  </div>
</template>
<style>
  .barWrapper{
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0.5rem;
    height: 4rem;
    box-sizing: border-box;
  }
</style>
<script>
export default {
  name: 'ChessBottomBar',
  props: ['toggleConfigPannel', 'showConfigurePannel', 'startNewGame']
}
</script>
