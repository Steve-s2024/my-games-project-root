class Box {
    coor = []
    size = []
    constructor (coor = [0, 0], size = [20, 20]) {
      const width = parseInt(Math.max(20, size[0]))
      const height = parseInt(Math.max(20, size[1]))
      const x = parseInt(coor[0])
      const y = parseInt(coor[1])
      this.coor = [x, y]
      this.size = [width, height]
    }
}

class MovableBox {
    xAccel = 0
    xVel = 0
    yAccel = 0
    yVel = 0
    box = null
    fps = 0
    maxVel = 400
    constructor (coor, size, fps) {
      this.box = new Box(coor, size)
      this.fps = fps
    }

    changeAccel (xAccel = this.xAccel, yAccel = this.yAccel) {
      this.xAccel = xAccel
      this.yAccel = yAccel
    }

    updateVel () {
      this.xVel += (this.xAccel / this.fps)
      this.yVel += (this.yAccel / this.fps)
      if (this.xVel > this.maxVel) this.xVel = this.maxVel
      if (this.xVel < -this.maxVel) this.xVel = -this.maxVel
      if (this.yVel > this.maxVel) this.yVel = this.maxVel
      if (this.yVel < -this.maxVel) this.yVel = -this.maxVel
    }

    updateCoor () {
      this.box.coor[0] += (this.xVel / this.fps)
      this.box.coor[1] += (this.yVel / this.fps)
    }

    getCoor () {
      const x = parseInt(this.box.coor[0])
      const y = parseInt(this.box.coor[1])
      return [x, y]
    }

    getSize () {
      return this.box.size
    }
}

export {
  MovableBox
}
