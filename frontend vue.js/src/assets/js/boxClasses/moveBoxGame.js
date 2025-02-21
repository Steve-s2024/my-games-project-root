/* eslint-disable no-unused-vars */
import { MovableBox } from './movableBox'
class MoveBoxGame {
    GVTTIONAL_ACCR = 800
    HEIGHT = 500
    WIDTH = 500
    movableBox = null
    updateInterval = null
    framePerSec = 30
    frictionDecceleration = 150
    obstacles = []
    boxCoors = []
    xCount = []
    yCount = []

    constructor (coor = [0, 0], size = [20, 20], framePerSec = 30) {
      this.framePerSec = framePerSec
      this.initBoxCoors()
      this.addMovableBox(coor, size)
    }

    addMovableBox (coor, size) {
      this.setBoxCoor(coor, size)
      this.movableBox = new MovableBox(coor, size, this.framePerSec)
    }

    initBoxCoors () {
      this.xCount = new Array(this.WIDTH + 1).fill(0)
      this.yCount = new Array(this.HEIGHT + 1).fill(0)
      for (let yIdx = 0; yIdx < this.HEIGHT + 1; yIdx++) {
        this.boxCoors.push(new Array(this.WIDTH + 1).fill(0))
      }
    }

    setBoxCoor (coor, size) {
      const [x, y] = coor
      const [width, height] = size
      const vertices = [[x, y], [x, y + height], [x + width, y], [x + width, y + height]]
      vertices.forEach((vertex) => {
        const [xIdx, yIdx] = vertex
        this.boxCoors[yIdx][xIdx]++
        this.xCount[xIdx]++
        this.yCount[yIdx]++
      })
    }

    removeBoxCoor (coor, size) {
      const [x, y] = coor
      const [width, height] = size
      const vertices = [[x, y], [x, y + height], [x + width, y], [x + width, y + height]]
      vertices.forEach((vertex) => {
        const [xIdx, yIdx] = vertex
        this.boxCoors[yIdx][xIdx]--
        this.xCount[xIdx]--
        this.yCount[yIdx]--
      })
    }

    addObstacle (coor, size) {
      const obstacle = new MovableBox(coor, size, this.framePerSec)
      this.setBoxCoor(coor, size)
      this.obstacles.push(obstacle)
    }

    createUpdateInterval () {
      this.updateInterval = setInterval(() => {
        this.update()
      }, 1000 / this.framePerSec)
    }

    clearUpdateInterval () {
      clearInterval(this.updateInterval)
    }

    update () {
      if (this.movableBox) this.updateBox(this.movableBox)

      this.obstacles.forEach((obstacle) => {
        this.updateBox(obstacle)
      })
    }

    updateBox (box) {
      const [sX, sY] = box.box.coor
      box.updateVelocity()
      box.updateCoor()
      this.detectBoxCoor(box)

      const [eX, eY] = box.box.coor
      if (sX !== eX || sY !== eY) {
        const size = box.getDmsion()
        this.removeBoxCoor([sX, sY], size)
        const ovlapCoor = this.checkIfOverlap(box.getCoor(), size)
        if (ovlapCoor) {
          this.fixBoxOverlap(box, ovlapCoor)
          // box.box.coor[0] -= 20
          // box.box.coor[1] -= 20
          // box.changeAcceleration(0, 0)
          // box.xVelocity = 0
          // box.yVelocity = 0
        }
        this.setBoxCoor(box.getCoor(), box.getDmsion())
      }
    }

    fixBoxOverlap (box, ovlapCoor, index) {
      if (index > 1) return
      if (!ovlapCoor) return
      if (box.xVelocity === 0 && box.yVelocity === 0) return
      const xVel = Math.max((box.xVelocity / this.framePerSec), 10E-10)
      const yVel = Math.max((box.yVelocity / this.framePerSec), 10E-10)
      const [x, y] = box.getCoor()
      const [width, height] = box.getDmsion()
      const [ovlapX, ovlapY] = ovlapCoor
      const oldX = x - Math.ceil(xVel)
      const oldY = y - Math.ceil(yVel)
      let xDist, yDist
      if (xVel > 0) {
        xDist = Math.max(0, ovlapX - (oldX + width))
      }
      if (xVel < 0) {
        xDist = Math.max(0, oldX - ovlapX)
      }
      if (yVel > 0) {
        yDist = Math.max(0, ovlapY - (oldY + height))
      }
      if (yVel < 0) {
        yDist = Math.max(0, oldY - ovlapY)
      }
      console.log(xVel, yVel, xDist, yDist) // 0 2 0 1
      const xTime = (xDist / xVel)
      const yTime = (yDist / yVel)

      const xCoeff = xVel > 0 ? 1 : -1
      const yCoeff = yVel > 0 ? 1 : -1
      let step, velRatio
      if (xTime >= yTime) {
        // contact horizontally
        step = xDist - 1
        velRatio = (yVel / xVel)
        box.box.coor[0] = oldX + xCoeff * (step)
        box.box.coor[1] = oldY + yCoeff * Math.ceil(step * velRatio)
        box.changeAcceleration(0)
        box.xVelocity = 0
      }
      if (yTime >= xTime) {
        // contact vertically
        step = yDist - 1
        velRatio = (xVel / yVel)
        box.box.coor[1] = oldY + yCoeff * (step)
        box.box.coor[0] = oldX + xCoeff * Math.ceil(step * velRatio)
        box.changeAcceleration(undefined, 0)
        box.yVelocity = 0
      }
      if (xVel < 0) box.box.coor[0] += 5
    }

    jump () {
      if (this.checkIfOnGround(this.movableBox)) {
        this.movableBox.yVelocity = -400
      }
    }

    speedUpHorizontally (direction) {
      if (direction === 'l') {
        this.movableBox.changeAcceleration(-300)
      }
      if (direction === 'r') {
        this.movableBox.changeAcceleration(300)
      }
    }

    stopHorizontalSpeedUp () {
      if (this.movableBox.xAcceleration !== 0) this.movableBox.changeAcceleration(0)
    }

    detectBoxCoor (box) {
      if (box === undefined) return

      const [x, y] = box.getCoor()
      const [width, height] = box.getDmsion()
      const xVelocity = box.xVelocity
      const yVelocity = box.yVelocity
      if (x <= 0 && xVelocity < 0) {
        box.changeAcceleration(0)
        box.xVelocity = 0
        box.box.coor[0] = 0
      }
      if (x + width >= this.WIDTH && xVelocity > 0) {
        box.changeAcceleration(0)
        box.xVelocity = 0
        box.box.coor[0] = this.WIDTH - width
      }

      if (y <= 0 && yVelocity < 0) {
        box.changeAcceleration(undefined, 0)
        box.yVelocity = 0
        box.box.coor[1] = 0
      }
      if (y + height >= this.HEIGHT && yVelocity > 0) {
        box.changeAcceleration(undefined, 0)
        box.yVelocity = 0
        box.box.coor[1] = this.HEIGHT - height
      }

      const ifOnGround = this.checkIfOnGround(box)
      if (ifOnGround) {
        if (box.xVelocity > 0) {
          box.xVelocity -= this.frictionDecceleration / this.framePerSec
          box.xVelocity = Math.max(box.xVelocity, 0)
        } else if (box.xVelocity < 0) {
          box.xVelocity += this.frictionDecceleration / this.framePerSec
          box.xVelocity = Math.min(box.xVelocity, 0)
        }
      } else {
        box.changeAcceleration(undefined, this.GVTTIONAL_ACCR)
      }
    }

    checkIfOverlap (coor, size) {
      const [x, y] = coor
      const [width, height] = size
      for (let yIdx = y; yIdx < y + height; yIdx++) {
        if (this.yCount[yIdx] !== 0) {
          for (let xIdx = x; xIdx < x + width; xIdx++) {
            if (this.boxCoors[yIdx][xIdx] !== 0) {
              console.log('overlaping')
              return [xIdx, yIdx]
            }
          }
        }
      }
      return false
    }

    checkIfOnGround (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getDmsion()
      if (y + height === this.HEIGHT) return true
      const arr = this.boxCoors[y + height].slice(x, x + width)
      arr.forEach(cell => {
        if (cell > 0) return true
      })
      return false
    }
}

export {
  MoveBoxGame
}
