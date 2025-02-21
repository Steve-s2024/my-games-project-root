<template>
    <div id="buttonWrapper">
        <button id="restart" class="button" @click="restart">restart</button>
        <button id="exit" class="button" @click="exit">exit</button>
    </div>
</template>
<script>
export default {
  name: 'ButtomBar',
  props: ['restart', 'exit']
}
</script>
