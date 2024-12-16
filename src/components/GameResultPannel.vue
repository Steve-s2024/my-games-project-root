<template>
    <div id="resultPannel">
        <div
        v-for="(value, key, idx) in gameResults"
        :key="idx">{{ key + ": " + value }}</div>
    </div>
</template>
<script>
export default {
  name: 'GameResultPannel',
  props: ['gameResults']
}
</script>
