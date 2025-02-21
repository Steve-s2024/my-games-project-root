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
    coorMap = new Map()
    boxElesticity = 1.3
    wallElesticity = 1

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
      if (
        (x < 0 || x + width - 1 >= this.width) ||
        (y < 0 || y + height - 1 >= this.height)
      ) {
        return false
      }
      const vertices = [[x, y], [x, y + height - 1], [x + width - 1, y], [x + width - 1, y + height - 1]]
      vertices.forEach(vertex => {
        const [xIdx, yIdx] = vertex
        this.boxCoorBoard[yIdx][xIdx]++
        this.yCount[yIdx]++
        this.xCount[xIdx]++
        this.coorMap.set(xIdx + ',' + yIdx, box)
      })
      return true
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
        this.coorMap.delete(xIdx + ',' + yIdx)
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
      const id = this.boxes.length + 1
      const x = parseInt(coor[0])
      const y = parseInt(coor[1])
      coor = [x, y]
      const width = parseInt(size[0])
      const height = parseInt(size[1])
      size = [width, height]
      const box = new MovableBox(id, coor, size, this.fps)
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
        try {
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
              // get the overlapping box and store it as box2
              const [x, y] = overlapCoor
              const box2 = this.coorMap.get(x + ',' + y)
              // store the speed of box and box2 temperarily to pass to applySpeedByCollision
              const speeds = [[box.xVel, box.yVel], [box2.xVel, box2.yVel]]
              // same goes to the acceleration of the boxes
              const accel = [[box.xAccel, box.yAccel], [box2.xAccel, box2.yAccel]]
              // console.log(box2.id)

              const collisionDirection = this.fixBoxOverlap(box, overlapCoor)
              // console.log(collisionDirection)
              // reassign the temperary stored speed for the function applySpeedByCollision
              box.xVel = speeds[0][0]
              box.yVel = speeds[0][1]
              box2.xVel = speeds[1][0]
              box2.yVel = speeds[1][1]
              // assign the temperary stored acceleration
              box.xAccel = accel[0][0]
              box.yAccel = accel[0][1]
              box2.xAccel = accel[1][0]
              box2.yAccel = accel[1][1]
              this.applySpeedByCollision(box, box2, collisionDirection)
            }
          }
          if (this.checkIfOnGround(box)) {
            // console.log('box on ground')
            this.applyFriction(box)
            box.changeAccel(undefined, 0)
            box.yVel = 0
          } else {
            this.applyGravitationalForce(box)
          }
          if (!this.setBoxCoor(box)) {
            // the setBoxCoor failed due to illegal coor
            // randomly assign the box with error to a different place
            const [w, h] = box.getSize()
            while (true) {
              box.box.coor = [(this.width - w) * Math.random(), (this.height - h) * Math.random()]
              if (!this.checkIfOverlap(box)) {
                break
              }
            }
            this.setBoxCoor(box)
          }
        } catch (exception) {
          // randomly assign the box with error to a different place
          const [w, h] = box.getSize()
          while (true) {
            box.box.coor = [(this.width - w) * Math.random(), (this.height - h) * Math.random()]
            if (!this.checkIfOverlap(box)) {
              break
            }
          }
          this.setBoxCoor(box)
        }
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
        // box.changeAccel(0)
        // box.xVel = 0
        box.xVel = -box.xVel * this.wallElesticity
      }
      if (x + width > this.width) {
        box.box.coor[0] = this.width - width
        // box.changeAccel(0)
        // box.xVel = 0
        box.xVel = -box.xVel * this.wallElesticity
      }
      if (y < 0) {
        box.box.coor[1] = 0
        // box.changeAccel(undefined, 0)
        // box.yVel = 0
        box.yVel = -box.yVel * this.wallElesticity
      }
      if (y + height > this.height) {
        box.box.coor[1] = this.height - height
        // box.changeAccel(undefined, 0)
        // box.yVel = 0
        box.yVel = -box.yVel * this.wallElesticity
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
      let collisionDirection = ''

      if (xVel === 0 && yVel !== 0) {
        // if xVel is zero, than since the method is called, we could say that xDist must be negative
        box.box.coor[1] = oldY + yCoeff * (yDist)
        box.changeAccel(undefined, 0)
        box.yVel = 0
        collisionDirection = 'v'
      }
      if (yVel === 0 && xVel !== 0) {
        // if yVel is zero, than since the method is called, we could say that yDist must be negative
        box.box.coor[0] = oldX + xCoeff * (xDist)
        box.changeAccel(0)
        box.xVel = 0
        collisionDirection = 'h'
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
          collisionDirection = 'h'
        }
        if (yTime > xTime) {
          // contact vertically
          const velRatio = Math.abs(xVel / yVel)
          box.box.coor[0] = oldX + xCoeff * (yDist * velRatio)
          box.box.coor[1] = oldY + yCoeff * (yDist)
          box.changeAccel(undefined, 0)
          box.yVel = 0
          collisionDirection = 'v'
        }
      }
      return collisionDirection
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

      let collisionDirection = ''
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
          collisionDirection = 'h'
        }
        if (yTime > xTime) {
          // contact vertically
          const velRatio = Math.abs(xVel / yVel)
          box.box.coor[0] = oldX + xCoeff * (yDist * velRatio)
          box.box.coor[1] = oldY + yCoeff * (yDist)
          box.changeAccel(undefined, 0)
          box.yVel = 0
          collisionDirection = 'v'
        }
      }
      return collisionDirection
    }

    applySpeedByCollision (inputBox1, inputBox2, collisionDirection) {
      if (collisionDirection === 'h') {
        // contact horizontally

        // first step: determine the relative position of the two box when collide. let box1 be the left box
        // box2 be the right box
        let box1, box2
        if (inputBox1.getCoor()[0] < inputBox2.getCoor()[0]) {
          box1 = inputBox1
          box2 = inputBox2
        } else {
          box1 = inputBox2
          box2 = inputBox1
        }

        const relativeXVel = Math.abs(box1.xVel - box2.xVel)

        box1.xVel -= (relativeXVel / 2) * this.boxElesticity
        box2.xVel += (relativeXVel / 2) * this.boxElesticity
      }
      if (collisionDirection === 'v') {
        // contact vertically

        // first step: determine the relative position of the two box when collide. let box1 be the top box
        // box2 be the bottom box
        let box1, box2
        if (inputBox1.getCoor()[1] < inputBox2.getCoor()[1]) {
          box1 = inputBox1
          box2 = inputBox2
        } else {
          box1 = inputBox2
          box2 = inputBox1
        }

        const relativeYVel = Math.abs(box1.yVel - box2.yVel)
        box1.yVel -= (relativeYVel / 2) * this.boxElesticity
        box2.yVel += (relativeYVel / 2) * this.boxElesticity
      }
    }
}

export {
  BoxPhysics
}
