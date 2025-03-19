<template>
    <div id="keyboardFrame">
      <div class="row" v-for="(row, rowIdx) in KEYBOARD" :key="rowIdx">
        <div
        :id="rowIdx + ',' + colIdx"
        v-for="(block, colIdx) in row"
        :key="rowIdx + ',' + colIdx"
        :class="(rowIdx + colIdx) % 2 == 0 ? 'whiteBlock' : 'blackBlock'"
        :style="{
          'width': BLOCK_WIDTH + 'rem',
          'height':BLOCK_HEIGHT + 'rem'
        }"
        @click="clickBlock([rowIdx, colIdx])"
        @mousedown="$emit('mouseDown', [rowIdx, colIdx])"
        @mouseup="$emit('mouseUp', [rowIdx, colIdx])"
        @dragstart="(event) => event.preventDefault()"
        >
          <PieceComp
          v-if="KEYBOARD[rowIdx][colIdx] != null"
          :type="KEYBOARD[rowIdx][colIdx].type"
          :side="KEYBOARD[rowIdx][colIdx].side"
          :imgSrc="imgsObj[(
            KEYBOARD[rowIdx][colIdx].side +
            KEYBOARD[rowIdx][colIdx].name
          )]"
          />
          <!-- :imgSrc="imgsObj[(
            (side in KEYBOARD[rowIdx][colIdx] ? KEYBOARD[rowIdx][colIdx].side : '') +
            (name in KEYBOARD[rowIdx][colIdx] ? KEYBOARD[rowIdx][colIdx].name : '')
          )]" -->
          <div class="rowIdx" v-if="colIdx == KEYBOARD[0].length-1">
            {{ rowIdx+1 }}
          </div>
          <div class="colIdx" v-if="rowIdx == 0">
            {{ String.fromCharCode((KEYBOARD[0].length-colIdx-1)+65) }}
          </div>
        </div>
      </div>
    </div>
</template>
<script>
import { nextTick } from 'vue'
import PieceComp from './PieceComp.vue'

export default {
  name: 'KeyboardComp',
  components: {
    PieceComp
  },
  props: ['WIDTH', 'HEIGHT', 'KEYBOARD', 'clickBlock', 'imgsObj'],
  data () {
    return {
      BLOCK_WIDTH: 5,
      BLOCK_HEIGHT: 5,
      KEY_BOARD_BLOCKS: [],
      currPiece: null
    }
  },
  mounted () {
    nextTick(() => {
      this.initKeyboardBlocks()
    })
  },
  methods: {
    initKeyboardBlocks () {
      for (let rowIdx = 0; rowIdx < this.HEIGHT; rowIdx++) {
        this.KEY_BOARD_BLOCKS.push([])
        for (let colIdx = 0; colIdx < this.WIDTH; colIdx++) {
          const ID = rowIdx + ',' + colIdx
          const BLOCK = document.getElementById(ID)
          this.KEY_BOARD_BLOCKS[rowIdx].push(BLOCK)
        }
      }
      this.$emit('keyboardBlocksLoaded', this.KEY_BOARD_BLOCKS)
    }
  }
}
</script>
