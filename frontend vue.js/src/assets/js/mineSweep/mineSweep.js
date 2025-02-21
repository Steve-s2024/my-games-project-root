class MineSweep {
  /*
for each cell inside the BOARD, they have three attributes
[0] is their value, -1 --> mine, 0-8 --> number of surrounding mines
[1] is their flag value, 0 --> unflagged , 1 --> flagged
[2] is their open value, 0 --> unopen, 1o --> open
  */
    HEIGHT = 3
    WIDTH = 3
    BOARD = []
    status = 'pending'
    possibility = 30
    mineNum = 0
    flagNum = 0
    openedCellNum = 0
    result = 'pending'
    gameTime = 0
    gameTimeInterval = null
    constructor (HEIGHT, WIDTH) {
      this.HEIGHT = HEIGHT
      this.WIDTH = WIDTH
    }

    initMineSweep (possibility = 30) {
      this.status = 'pending'
      this.possibility = possibility
      this.mineNum = 0
      this.flagNum = 0
      this.openedCellNum = 0
      this.result = 'pending'
      this.gameTime = 0
      clearInterval(this.gameTimeInterval)
      this.initBoards()
      // console.log('the layout of mines: ', this.BOARD)
    }

    initMineSweepWithCoor (coor) {
      this.gameTimeInterval = setInterval(() => {
        this.gameTime++
      }, 1000)

      if (this.BOARD.length === 0) this.initBoards()
      this.generateMines()

      // console.log(`mine generated, start clearing the mines around ${coor}`)
      const [row, col] = coor
      const steps = [[1, 1], [1, 0], [1, -1], [0, 1], [0, 0], [0, -1], [-1, 1], [-1, 0], [-1, -1]]
      let rowStep, colStep, rowIdx, colIdx
      for (let idx = 0; idx < steps.length; idx++) {
        [rowStep, colStep] = steps[idx]
        rowIdx = row + rowStep
        colIdx = col + colStep
        if (rowIdx < 0 || rowIdx > this.HEIGHT - 1) continue
        if (colIdx < 0 || colIdx > this.WIDTH - 1) continue
        this.BOARD[rowIdx][colIdx][0] = 0
      }
      // console.log(`mines around ${coor} are all cleared`, this.BOARD)
      this.updateMineNumber()
      this.generateCellValues()
    }

    initBoards () {
      this.BOARD.length = 0
      for (let rowIdx = 0; rowIdx < this.HEIGHT; rowIdx++) {
        this.BOARD[rowIdx] = []
        for (let colIdx = 0; colIdx < this.WIDTH; colIdx++) {
          const cell = new Array(3).fill(0)
          this.BOARD[rowIdx].push(cell)
        }
      }
    }

    generateMines () {
      for (let rowIdx = 0; rowIdx < this.HEIGHT; rowIdx++) {
        for (let colIdx = 0; colIdx < this.WIDTH; colIdx++) {
          this.BOARD[rowIdx][colIdx][0] = this.generateMine(this.possibility)
        }
      }
    }

    generateMine (possibility) {
      const ifMine = Math.floor(Math.random() * 100) < possibility
      return ifMine ? -1 : 0
    }

    generateCellValues () {
      for (let rowIdx = 0; rowIdx < this.HEIGHT; rowIdx++) {
        for (let colIdx = 0; colIdx < this.WIDTH; colIdx++) {
          if (this.BOARD[rowIdx][colIdx][0] !== -1) {
            this.BOARD[rowIdx][colIdx][0] = this.generateCellValue([rowIdx, colIdx])
          }
        }
      }
    }

    generateCellValue (coor) {
      const [row, col] = coor
      const steps = [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]]
      let value = 0
      for (let idx = 0; idx < steps.length; idx++) {
        const [rowStep, colStep] = steps[idx]
        const rowIdx = row + rowStep
        const colIdx = col + colStep
        if (rowIdx < 0 || rowIdx > this.HEIGHT - 1) continue
        if (colIdx < 0 || colIdx > this.WIDTH - 1) continue
        const surroundingValue = this.BOARD[row + rowStep][col + colStep][0]
        if (surroundingValue === -1) value++
      }
      return value
    }

    openCell (coor) {
      if (this.status === 'ended') return
      const [row, col] = coor
      const cell = this.BOARD[row][col]
      const [value, flagVal, openVal] = cell

      if (flagVal === 1) {
        // console.log('the cell cannot be open because it is flagged')
      } else if (openVal === 1) {
        // console.log('the cell is already opened')
      } else {
        // console.log('cell can be opened')

        if (this.status === 'pending') {
          this.status = 'ongoing'
          this.initMineSweepWithCoor(coor)
        }

        cell[2] = 1
        this.openedCellNum++
        if (value === -1) {
          // console.log('the opened cell is a mine, game over!')
          this.openedCellNum--
          return this.endGame()
        } else if (value >= 0 && value <= 8) {
          // console.log('the opened cell is clear')
          this.spreadVoidCell(coor)
        }
      }
      if (this.checkIfGameOver()) {
        // console.log('you win the game')
        this.flagNum = this.mineNum
        return this.endGame()
      }
    }

    flagCell (coor) {
      if (this.status === 'ended' || this.status === 'pending') return
      const [row, col] = coor
      const cell = this.BOARD[row][col]
      // eslint-disable-next-line no-unused-vars
      const [value, flagVal, openVal] = cell
      if (openVal === 1) {
        // console.log('cannot flag a opened cell')
      } else if (flagVal === 0) {
        // console.log('add flag to cell')
        cell[1] = 1
        this.flagNum++
      } else if (flagVal === 1) {
        // console.log('remove flag from cell')
        cell[1] = 0
        this.flagNum--
      }
    }

    spreadVoidCell (coor) {
      const [sRow, sCol] = coor
      if (this.BOARD[sRow][sCol][0] !== 0) return
      const steps = [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]]
      const visited = new Map()
      visited.set(sRow + '' + sCol, true)
      const queue = [[sRow, sCol]]
      while (queue.length) {
        const [row, col] = queue.shift()
        let surrounding
        let rowStep, colStep
        let rowIdx, colIdx
        for (let idx = 0; idx < steps.length; idx++) {
          [rowStep, colStep] = steps[idx]
          rowIdx = row + rowStep
          colIdx = col + colStep
          if (rowIdx < 0 || rowIdx > this.HEIGHT - 1) continue
          if (colIdx < 0 || colIdx > this.WIDTH - 1) continue
          if (visited.get(rowIdx + '' + colIdx) !== true) {
            surrounding = this.BOARD[rowIdx][colIdx]
            if (surrounding[2] === 0) {
              surrounding[2] = 1
              this.openedCellNum++
            }
            visited.set(rowIdx + '' + colIdx, true)
            if (surrounding[0] === 0) queue.push([rowIdx, colIdx])
          }
        }
      }
    }

    spreadCell (coor) {
      const steps = [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]]
      const [row, col] = coor
      const cell = this.BOARD[row][col]
      let rowStep, colStep, rowIdx, colIdx
      let surrounding
      let flagCount = 0
      const unopenCoors = []
      for (const step of steps) {
        [rowStep, colStep] = step
        rowIdx = row + rowStep
        colIdx = col + colStep
        if (rowIdx < 0 || rowIdx > this.HEIGHT - 1) continue
        if (colIdx < 0 || colIdx > this.WIDTH - 1) continue
        surrounding = this.BOARD[rowIdx][colIdx]
        if (surrounding[1] === 1) flagCount++
        else if (surrounding[2] === 0) unopenCoors.push([rowIdx, colIdx])
      }
      if (flagCount === cell[0]) {
        // console.log('the amount of flagged cell is the same as the value of cell suggests')
        unopenCoors.forEach((unopenCoor) => {
          this.openCell(unopenCoor)
        })
      } else {
        // console.log(`the amount of flagged cell around ${coor} is not the same as the value of ${coor}`)
      }
    }

    updateMineNumber () {
      if (this.BOARD.length) {
        this.mineNum = 0
        for (const row of this.BOARD) {
          for (const cell of row) {
            if (cell[0] === -1) this.mineNum++
          }
        }
      }
    }

    checkIfGameOver () {
      if (this.status === 'ended') return true
      const numOfCell = this.HEIGHT * this.WIDTH
      if (numOfCell === this.openedCellNum + this.mineNum) return true
      else return false
    }

    changeBoardSize (height, width) {
      this.HEIGHT = height
      this.WIDTH = width
      this.initMineSweep()
    }

    endGame () {
      this.status = 'ended'
      const result = this.HEIGHT * this.WIDTH === this.openedCellNum + this.mineNum
      this.result = result ? 'win' : 'fail'
      clearInterval(this.gameTimeInterval)
    }
}

export {
  MineSweep
}
