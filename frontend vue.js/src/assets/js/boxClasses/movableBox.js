import { Box } from './box'
class MovableBox {
    xVelocity = 0
    xAcceleration = 0
    yVelocity = 0
    yAcceleration = 0
    box = null
    framePerSec = 30
    constructor (coor = [0, 0], size = [20, 20], framePerSec = 30) {
      this.framePerSec = framePerSec
      this.box = new Box(coor, size)
    }

    changeAcceleration (xAcceleration = this.xAcceleration, yAcceleration = this.yAcceleration) {
      this.xAcceleration = xAcceleration // the acceleration --> the change in velocity (per second!!)
      this.yAcceleration = yAcceleration // the acceleration --> the change in velocity (per second!!)
    }

    updateVelocity () {
      this.xVelocity += (this.xAcceleration / this.framePerSec)
      this.yVelocity += (this.yAcceleration / this.framePerSec)
    }

    updateCoor () {
      this.box.coor[0] += parseInt(this.xVelocity / this.framePerSec)
      this.box.coor[1] += parseInt(this.yVelocity / this.framePerSec)
    }

    getCoor () {
      return this.box.coor
    }

    getDmsion () {
      return this.box.size
    }
}

export {
  MovableBox
}
