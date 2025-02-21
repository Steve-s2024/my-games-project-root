<template>
  <div :class="'piece ' + (side == 'white' ? 'whitePiece' : 'blackPiece') + ' ' + type">{{type}}</div>
</template>
<script>
export default {
  name: 'PieceComp',
  props: ['type', 'side']
}
</script>
