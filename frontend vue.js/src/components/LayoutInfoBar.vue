<template>
  <div id="layoutInfoBar">
    <div>name: {{ currLayout.name }}</div>
    <div>difficulty: {{ currLayout.difficulty }}</div>
    <div class="button" @click="showLayoutOptions = !showLayoutOptions">layouts</div>
    <div class="layoutList" v-show="showLayoutOptions">
      <div class="layout" v-for="(layout, idx) in chessLayouts" :key="idx">
        <div class="layoutInfos" @click="showLayoutOptions = false; optLayout(idx)">
          <div>name: {{ layout.name }}</div>
          <div>difficulty: {{ layout.difficulty }}</div>
          <div>starting side: {{ layout.side }}</div>
        </div>
        <button @click="() => {deleteLayout(idx)}">delete</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LayoutInfoBar',
  props: ['currLayout', 'chessLayouts', 'optLayout', 'deleteSavedGame'],
  data () {
    return {
      showLayoutOptions: false
    }
  },
  methods: {
    deleteLayout (idx) {
      this.deleteSavedGame(idx)
    }
  }

}
</script>
