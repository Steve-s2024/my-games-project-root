import { MovableBox } from './boxes'

class BoxPhysics {
    boxes = []
    box = null
    height = 0
    width = 0
    fps = 0
    GVTTN_FORCE = 500
    FRICTION = 100
    updateInterval = null
    boxCoorBoard = []
    yCount = 0
    xCount = 0
    ground = 0

    constructor (height = 500, width = 500, fps = 0) {
      this.height = height
      this.width = width
      this.fps = fps
      this.ground = this.height
      this.initBoxCoorBoard()
    }

    initBoxCoorBoard () {
      for (let yIdx = 0; yIdx < this.height; yIdx++) {
        this.boxCoorBoard.push(new Array(this.width).fill(0))
      }
      this.yCount = new Array(this.height).fill(0)
      this.xCount = new Array(this.width).fill(0)
    }

    setBoxCoor (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      const vertices = [[x, y], [x, y + height - 1], [x + width - 1, y], [x + width - 1, y + height - 1]]
      vertices.forEach(vertex => {
        const [xIdx, yIdx] = vertex
        this.boxCoorBoard[yIdx][xIdx]++
        this.yCount[yIdx]++
        this.xCount[xIdx]++
      })
    }

    removeBoxCoor (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      const vertices = [[x, y], [x, y + height - 1], [x + width - 1, y], [x + width - 1, y + height - 1]]
      vertices.forEach(vertex => {
        const [xIdx, yIdx] = vertex
        this.boxCoorBoard[yIdx][xIdx]--
        this.yCount[yIdx]--
        this.xCount[xIdx]--
      })
    }

    createUpdateInterval () {
      this.updateInterval = setInterval(() => {
        this.update()
      }, 1000 / this.fps)
    }

    clearUpdateInterval () {
      clearInterval(this.updateInterval)
    }

    addBox (coor = [0, 0], size = [20, 20]) {
      const x = parseInt(coor[0])
      const y = parseInt(coor[1])
      coor = [x, y]
      const width = parseInt(size[0])
      const height = parseInt(size[1])
      size = [width, height]
      const box = new MovableBox(coor, size, this.fps)
      if (this.checkIfOverlap(box)) return
      this.setBoxCoor(box)
      this.boxes.push(box)
    }

    removeBox () {
      if (this.boxes.length > 1) {
        const box = this.boxes.pop()
        this.removeBoxCoor(box)
      }
    }

    addMainBox (coor, size) {
      this.addBox(coor, size)
      this.box = this.boxes[this.boxes.length - 1]
    }

    applyHorizontalAccel (direction) {
      if (direction === 'l') {
        this.box.changeAccel(-300)
      }
      if (direction === 'r') {
        this.box.changeAccel(300)
      }
    }

    stopHorizontalAccel () {
      this.box.changeAccel(0)
    }

    jump () {
      if (this.checkIfOnGround(this.box)) {
        this.box.yVel = this.ground === 0 ? 200 : -200
      }
    }

    update () {
      this.updateBoxes()
    }

    updateBoxes () {
      this.boxes.forEach(box => {
        const [sX, sY] = box.getCoor()
        this.removeBoxCoor(box)
        box.updateVel()
        box.updateCoor()
        this.fixIfOutside(box)
        const [eX, eY] = box.getCoor()
        if (sX !== eX || sY !== eY) {
          // console.log('the box is moved')
          const overlapCoor = this.checkIfOverlap(box)
          if (overlapCoor) {
            this.fixBoxOverlap(box, overlapCoor)
          }
        }
        const ifOnGround = this.checkIfOnGround(box)
        if (ifOnGround) {
          // console.log('box on ground')
          this.applyFriction(box)
          box.changeAccel(undefined, 0)
          box.yVel = 0
        } else {
          this.applyGravitationalForce(box)
        }
        this.setBoxCoor(box)
      })
    }

    applyFriction (box) {
      if (box.xVel > 0) {
        box.xVel -= parseInt(this.FRICTION / this.fps)
        box.xVel = Math.max(0, box.xVel)
      }
      if (box.xVel < 0) {
        box.xVel += parseInt(this.FRICTION / this.fps)
        box.xVel = Math.min(0, box.xVel)
      }
    }

    applyGravitationalForce (box) {
      box.changeAccel(undefined, this.GVTTN_FORCE)
    }

    fixIfOutside (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()

      if (x < 0) {
        box.box.coor[0] = 0
        box.changeAccel(0)
        box.xVel = 0
      }
      if (x + width > this.width) {
        box.box.coor[0] = this.width - width
        box.changeAccel(0)
        box.xVel = 0
      }
      if (y < 0) {
        box.box.coor[1] = 0
        box.changeAccel(undefined, 0)
        box.yVel = 0
      }
      if (y + height > this.height) {
        box.box.coor[1] = this.height - height
        box.changeAccel(undefined, 0)
        box.yVel = 0
      }
    }

    checkIfOnGround (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      if (this.ground === 0) {
        if (y === this.ground) return true
      } else if (this.ground === this.height) {
        if (y + height === this.ground) return true
      }
      const yLevel = this.ground === 0 ? y - 1 : y + height
      if (this.yCount[yLevel]) {
        const arr = this.boxCoorBoard[yLevel].slice(x, x + width)
        for (const cell of arr) {
          if (cell) return true
        }
      }
      return false
    }

    checkIfOverlap (box) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      for (let yIdx = y; yIdx < y + height; yIdx++) {
        if (this.yCount[yIdx]) {
          for (let xIdx = x; xIdx < x + width; xIdx++) {
            if (this.boxCoorBoard[yIdx][xIdx]) {
              return [xIdx, yIdx]
            }
          }
        }
      }
      return false
    }

    fixBoxOverlap (box, ovlapCoor) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      const [ovlapX, ovlapY] = ovlapCoor
      const xVel = (box.xVel / this.fps) // xVel is the instantenious rate of change in velocity of x coordinate
      const yVel = (box.yVel / this.fps) // yVel is the instantenious rate of change in velocity of y coordinate
      const oldX = x - xVel
      const oldY = y - yVel
      let xDist, yDist
      if (xVel >= 0) {
        xDist = ovlapX - (oldX + width)
      }
      if (xVel < 0) {
        xDist = oldX - ovlapX - 1
      }
      if (yVel >= 0) {
        yDist = ovlapY - (oldY + height)
      }
      if (yVel < 0) {
        yDist = oldY - ovlapY - 1
      }

      const xCoeff = xVel > 0 ? 1 : -1
      const yCoeff = yVel > 0 ? 1 : -1
      if (xVel === 0 && yVel !== 0) {
        // if xVel is zero, than since the method is called, we could say that xDist must be negative
        box.box.coor[1] = oldY + yCoeff * (yDist)
        box.changeAccel(undefined, 0)
        box.yVel = 0
      }
      if (yVel === 0 && xVel !== 0) {
        // if yVel is zero, than since the method is called, we could say that yDist must be negative
        box.box.coor[0] = oldX + xCoeff * (xDist)
        box.changeAccel(0)
        box.xVel = 0
      }

      if (xVel !== 0 && yVel !== 0) {
        const xTime = (xDist / Math.abs(xVel))
        const yTime = (yDist / Math.abs(yVel))
        if (xTime > yTime) {
          // contact horizontally
          const velRatio = Math.abs(yVel / xVel)
          box.box.coor[0] = oldX + xCoeff * (xDist)
          box.box.coor[1] = oldY + yCoeff * (xDist * velRatio)
          box.changeAccel(0)
          box.xVel = 0
        }
        if (yTime > xTime) {
          // contact vertically
          const velRatio = Math.abs(xVel / yVel)
          box.box.coor[0] = oldX + xCoeff * (yDist * velRatio)
          box.box.coor[1] = oldY + yCoeff * (yDist)
          box.changeAccel(undefined, 0)
          box.yVel = 0
        }
      }
    }

    changeGravitationalForce () {
      this.GVTTN_FORCE = -this.GVTTN_FORCE
      this.ground = this.ground === 0 ? this.height : 0
    }

    handleBoxCollide (box, ovlapCoor) {
      const [x, y] = box.getCoor()
      const [width, height] = box.getSize()
      const [ovlapX, ovlapY] = ovlapCoor
      const xVel = (box.xVel / this.fps) // xVel is the instantenious rate of change in velocity of x coordinate
      const yVel = (box.yVel / this.fps) // yVel is the instantenious rate of change in velocity of y coordinate
      const oldX = x - xVel
      const oldY = y - yVel
      let xDist, yDist
      if (xVel >= 0) {
        xDist = ovlapX - (oldX + width)
      }
      if (xVel < 0) {
        xDist = oldX - ovlapX - 1
      }
      if (yVel >= 0) {
        yDist = ovlapY - (oldY + height)
      }
      if (yVel < 0) {
        yDist = oldY - ovlapY - 1
      }

      const xCoeff = xVel > 0 ? 1 : -1
      const yCoeff = yVel > 0 ? 1 : -1
      if (xVel === 0 && yVel !== 0) {
        // if xVel is zero, than since the method is called, we could say that xDist must be negative
        box.box.coor[1] = oldY + yCoeff * (yDist)
        box.changeAccel(undefined, 0)
        box.yVel = 0
      }
      if (yVel === 0 && xVel !== 0) {
        // if yVel is zero, than since the method is called, we could say that yDist must be negative
        box.box.coor[0] = oldX + xCoeff * (xDist)
        box.changeAccel(0)
        box.xVel = 0
      }

      if (xVel !== 0 && yVel !== 0) {
        const xTime = (xDist / Math.abs(xVel))
        const yTime = (yDist / Math.abs(yVel))
        if (xTime > yTime) {
          // contact horizontally
          const velRatio = Math.abs(yVel / xVel)
          box.box.coor[0] = oldX + xCoeff * (xDist)
          box.box.coor[1] = oldY + yCoeff * (xDist * velRatio)
          box.changeAccel(0)
          box.xVel = 0
        }
        if (yTime > xTime) {
          // contact vertically
          const velRatio = Math.abs(xVel / yVel)
          box.box.coor[0] = oldX + xCoeff * (yDist * velRatio)
          box.box.coor[1] = oldY + yCoeff * (yDist)
          box.changeAccel(undefined, 0)
          box.yVel = 0
        }
      }
    }
}

export {
  BoxPhysics
}
