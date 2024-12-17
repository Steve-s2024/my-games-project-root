<template>
    <div id="mineSweepContent">

      <div
      id="mineSweepRow"
      v-for="(row, rowIdx) in BOARD"
      :key="rowIdx"
      @click.prevent>
        <div
        id="mineSweepCell"
        v-for="(cell, colIdx) in row"
        :key="rowIdx + ',' + colIdx"
        @click.right.prevent="clickBlock([rowIdx, colIdx], 'right')"
        @click.left.prevent="clickBlock([rowIdx, colIdx], 'left')"
        >
          <p v-if="cell[2] === 1" :class="'cellVal ' + (cell[0] === -1 ? 'mineCell' : '')" @click.prevent>
            {{ cell[0] === -1 ? '*' : cell[0] }}
          </p>
          <p class="cellFlag" v-if="cell[1] === 1">
            flag
          </p>
        </div>
      </div>

    </div>
</template>

<script>
export default {
  name: 'MineSweepBoard',
  props: ['HEIGHT', 'WIDTH', 'BOARD', 'clickBlock']
}
</script>
