<template>
  <!-- <div :class="'piece ' + (side == 'white' ? 'whitePiece' : 'blackPiece') + ' ' + type">{{type}}</div> -->

  <div :class="'piece ' + (side == 'white' ? 'whitePiece' : 'blackPiece') + ' ' + type">
    <div class="imgWrapper">
      <img :src="imgSrc">
    </div>
  </div>
</template>
<script>
export default {
  name: 'PieceComp',
  props: ['type', 'side', 'imgSrc']
}
</script>
