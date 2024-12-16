<template>
  <div id="layoutInfoBar">
    <div>name: {{ currLayout.name }}</div>
    <div>difficulty: {{ currLayout.difficulty }}</div>
    <div class="button" @click="showLayoutOptions = !showLayoutOptions">layouts</div>
    <div class="layoutList" v-if="showLayoutOptions">
      <div class="layout" @click="showLayoutOptions = false; optLayout(idx)" v-for="(layout, idx) in chessLayouts" :key="idx">
        <div>name: {{ layout.name }}</div>
        <div>difficulty: {{ layout.difficulty }}</div>
        <div>starting side: {{ layout.side }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LayoutInfoBar',
  props: ['currLayout', 'chessLayouts', 'optLayout'],
  data () {
    return {
      showLayoutOptions: false
    }
  }

}
</script>
