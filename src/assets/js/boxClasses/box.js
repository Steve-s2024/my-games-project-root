class Box {
    coor = [0, 0]
    size = [0, 0]
    constructor (coor, size) {
      size[0] = Math.max(20, size[0])
      size[1] = Math.max(20, size[1])
      this.coor = coor
      this.size = size
    }
}

export {
  Box
}
