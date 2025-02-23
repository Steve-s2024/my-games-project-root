/* eslint-disable eqeqeq */

class Chess {
    KEYBOARD_WIDTH = 8
    KEYBOARD_HEIGHT = 8
    keyboard = []
    currSide = 'white'
    currPiece = null
    whiteKing = null
    blackKing = null
    history = []
    moveRecord = []
    checkmatePiece = null
    status = 'pending'
    gameTime = 0
    winner = null
    timeInterval = null
    textQueue = []

    initKeyboard () {
      this.keyboard.length = 0 // clear the keyboard without changing its reference
      for (let i = 0; i < this.KEYBOARD_HEIGHT; i++) {
        this.keyboard.push(Array(this.KEYBOARD_WIDTH).fill(null))
      }
    }

    initChessGame (opening) {
      // console.log('initialize logical keyboard')
      this.initKeyboard()
      // console.log('logical keyboard initalized')
      this.currSide = opening.side
      this.currPiece = null
      this.whiteKing = null
      this.blackKing = null
      this.history = []
      this.moveRecord = []
      this.checkmatePiece = null
      this.status = 'ongoing'
      this.gameTime = 0
      this.winner = null
      clearInterval(this.timeInterval)
      this.timeInterval = setInterval(() => {
        this.gameTime += 1
      }, 1000)
      this.textQueue = []
      opening.layout.forEach(piece => {
        this.addPiece(...piece)
      })
      this.status = 'ongoing'
    }

    addPiece (side = 'white', coordinate = [0, 0], type = 'pawn') {
      const piece = Piece.generatePiece(side, coordinate, type)
      if (type == 'king') {
        if (side == 'white') {
          if (this.whiteKing) this.removeFromKeyboard(this.whiteKing)
          this.whiteKing = piece
        }
        if (side == 'black') {
          if (this.blackKing) this.removeFromKeyboard(this.blackKing)
          this.blackKing = piece
        }
      }
      this.addToKeyboard(piece)
    }

    addToKeyboard (piece) {
      const [row, col] = piece.coordinate
      this.keyboard[row][col] = piece
    }

    removeFromKeyboard (piece) {
      const [row, col] = piece.coordinate
      if (this.keyboard[row][col] == piece) {
        this.keyboard[row][col] = null
      }
    }

    makeChessMove (moves) {
      this.textQueue.length = 0
      if (this.status === 'ended') return
      // single move
      if (moves.length == 1) {
        const [piece, coordinate] = moves[0]
        const result = piece.checkMove(coordinate, this)
        if (Array.isArray(result)) {
          return this[result[0]](...result.slice(1))
        } else if (result == true) {
          // console.log('the move follows the rule of chess')
          // this.addText('the move follows the rule of chess')
        } else {
          // console.log('the move does not follow the rule of chess')
          this.addText('the move does not follow the rule of chess')
          return false
        }
      }

      // composite move
      const moveLen = moves.length
      this.moveRecord.push(moveLen)
      for (let idx = 0; idx < moveLen; idx++) {
        const [piece, coordinate] = moves[idx]
        this.loadMove(piece, coordinate)
      }

      // console.log('load move complete, start checking')
      if (this.varifyMoveByCheckmate(moves[moves.length - 1])) {
        // console.log('move completed')
        this.changeSide()
        return true
      } else {
        // console.log('move rejected, start to undo history')
        this.undoHistory()
        // console.log('undo history completed')
        return false
      }
    }

    loadMove (piece, newCoordinate) {
      this.addHistory(piece, newCoordinate)
      this.removeFromKeyboard(piece)
      piece.coordinate = newCoordinate
      this.updateIfMoved(piece)
      this.addToKeyboard(piece)
    }

    updateIfMoved (piece) {
      if (piece.moved == false) piece.moved = true
    }

    changeSide () {
      this.currSide = this.currSide == 'white' ? 'black' : 'white'
    }

    promotion (piece) {
      // console.log('enter promotion', piece)
      let target
      do {
        target = prompt('enter knight/bishop/rook/queen')
      }
      while (['knight', 'bishop', 'rook', 'queen'].indexOf(target) == -1)
      setTimeout(() => { // the settimeout is quite necessary, let me explain.
        /*
        the reason the setTimeout is necessary is because it will not make the calls from call stack to wait, so by the time the 100ms timeout,
        everything below promotion() in the call stack will finished executing, and the pawn will be already
        moved to the new position of the keyboard it intended but without being actually promoted (the pawn stay as pawn)
        eventually, about 100ms after the pawn moved, the logic below will execute and swap the pawn into the actual piece for the intended promotion.
        */
        if (this.currSide != piece.side) { // the side is changed, so the piece did get moved to the new position
          const coordinate = piece.coordinate
          const side = piece.side
          this.removeFromKeyboard(piece)
          this.addPiece(side, coordinate, target)
          this.changeSide() // change back to the side before, and varify if check mate with the promted peice
          this.varifyMoveByCheckmate()
          this.changeSide() // change the side back
        }
      }, 100)
    }

    castling (king, rook) {
      const [kRow, kCol] = king.coordinate
      const [rRow, rCol] = rook.coordinate

      const kingStep = (rCol - kCol) / Math.abs(rCol - kCol)
      const rookStep = -kingStep
      const compositeMove = [[king, [kRow, rCol - kingStep]], [rook, [rRow, rCol + 2 * rookStep]]]
      return this.makeChessMove(compositeMove)
    }

    checkmateChecker (king, piece, newCoordinate) {
      if (piece == null || newCoordinate == null) return
      // console.log("this function(checkmate checker) is checking for checkmate in the new move")
      // console.log(`checkmate checking for ${king.side} king`)
      let result = false
      const [kRow, kCol] = king.coordinate
      const [pRow, pCol] = piece.coordinate

      if (king.side != piece.side) {
        if (piece.checkMove(king.coordinate, this)) {
          // console.log("it is a checkmate directly caused by the new move")
          result = true
        }
      } else if (king != piece) {
        const rowDiff = Math.abs(kRow - pRow)
        const colDiff = Math.abs(kCol - pCol)
        if (rowDiff == colDiff) {
          // console.log("it could be a checkmate indirectly caused by the new move, and the threat can come from queen/bishop")
          const rowStep = (pRow - kRow) / Math.abs(pRow - kRow)
          const colStep = (pCol - kCol) / Math.abs(pCol - kCol)
          const target = this.searchByStep(king.coordinate, rowStep, colStep)
          if (target != null && target.side != king.side && ['queen', 'bishop'].includes(target.type)) {
            // console.log(`checkmate confirmed for ${king.side} king!`)
            result = true
          }
        }
        if ((rowDiff > 0 && colDiff == 0) || (rowDiff == 0 && colDiff > 0)) {
          // console.log("it could be a checkmate indirectly caused by the new move, and the threat can come from queen/rook")
          let rowStep = 0
          let colStep = 0
          if (kRow == pRow) {
            colStep = (pCol - kCol) / Math.abs(pCol - kCol)
          }
          if (kCol == pCol) {
            rowStep = (pRow - kRow) / Math.abs(pRow - kRow)
          }
          const target = this.searchByStep(king.coordinate, rowStep, colStep)
          if (target != null && target.side != king.side && ['queen', 'bishop'].includes(target.type)) {
            // console.log(`checkmate confirmed for ${king.side} king!`)
            result = true
          }
        }
      } else if (king == piece) {
        result = this.checkIfInDanger(king) != null
      }
      return result
    }

    searchStraightPath (start, end) {
      const [sRow, sCol] = start
      const [eRow, eCol] = end
      let rowIdx = sRow
      let rowStep = 0
      let colIdx = sCol
      let colStep = 0
      let target = null
      if (sRow == eRow) {
        colStep = (eCol - sCol) / Math.abs(eCol - sCol)
      }
      if (sCol == eCol) {
        rowStep = (eRow - sRow) / Math.abs(eRow - sRow)
      }
      do {
        rowIdx += rowStep
        colIdx += colStep
        if (rowIdx < 0 || rowIdx > this.KEYBOARD_HEIGHT - 1) break
        if (colIdx < 0 || colIdx > this.KEYBOARD_WIDTH - 1) break
        target = this.keyboard[rowIdx][colIdx]
      }
      while (target == null && (rowIdx != eRow || colIdx != eCol))
      return target
    }

    searchDiagnalPath (start, end) {
      const [sRow, sCol] = start
      const [eRow, eCol] = end
      let rowIdx = sRow
      const rowStep = (eRow - sRow) / Math.abs(eRow - sRow)
      let colIdx = sCol
      const colStep = (eCol - sCol) / Math.abs(eCol - sCol)
      let target
      do {
        rowIdx += rowStep
        colIdx += colStep
        if (rowIdx < 0 || rowIdx > this.KEYBOARD_HEIGHT - 1) break
        if (colIdx < 0 || colIdx > this.KEYBOARD_WIDTH - 1) break
        target = this.keyboard[rowIdx][colIdx]
      }
      while (target == null && rowIdx != eRow && colIdx != eCol)
      return target
    }

    searchByStep (start, rowStep, colStep) {
      if (start == null || rowStep == null || colStep == null) return
      let [rowIdx, colIdx] = start
      let target
      do {
        rowIdx += rowStep
        colIdx += colStep
        if (rowIdx < 0 || rowIdx > this.KEYBOARD_HEIGHT - 1) break
        if (colIdx < 0 || colIdx > this.KEYBOARD_WIDTH - 1) break
        target = this.keyboard[rowIdx][colIdx]
      }
      while (target == null)
      return target
    }

    checkIfInDanger (piece) {
      let steps

      steps = [[1, -1], [1, 1], [-1, 1], [-1, -1]]
      for (let idx = 0; idx < steps.length; idx++) {
        const [rowStep, colStep] = steps[idx]
        const target = this.searchByStep(piece.coordinate, rowStep, colStep)
        if (target != null && target.side != piece.side && ['queen', 'bishop'].includes(target.type)) {
          // console.log("the checkmate is confirmed and is directly caused by the new move")
          return target
        }
        if (
          target != null && target.side != piece.side &&
          target.type == 'pawn' &&
          target.checkMove(piece.coordinate, this)
        ) {
          return target
        }
      }

      steps = [[0, -1], [0, 1], [-1, 0], [1, 0]]
      for (let idx = 0; idx < steps.length; idx++) {
        const [rowStep, colStep] = steps[idx]
        const target = this.searchByStep(piece.coordinate, rowStep, colStep)
        if (target != null && target.side != piece.side && ['queen', 'rook'].includes(target.type)) {
          // console.log("the checkmate is confirmed and is directly caused by the new move")
          return target
        }
      }

      steps = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]]
      for (let idx = 0; idx < steps.length; idx++) {
        const [row, col] = piece.coordinate
        const rowIdx = row + steps[idx][0]
        const colIdx = col + steps[idx][1]
        if (rowIdx < 0 || rowIdx > this.KEYBOARD_HEIGHT - 1) continue
        if (colIdx < 0 || colIdx > this.KEYBOARD_WIDTH - 1) continue
        const target = this.keyboard[rowIdx][colIdx]
        if (target != null && target.side != piece.side && target.type == 'knight') {
          // console.log("the checkmate is confirmed and is directly caused by the new move")
          return target
        }
      }

      steps = [[1, -1], [1, 1], [-1, 1], [-1, -1], [0, -1], [0, 1], [-1, 0], [1, 0]]
      for (let idx = 0; idx < steps.length; idx++) {
        const [row, col] = piece.coordinate
        const rowIdx = row + steps[idx][0]
        const colIdx = col + steps[idx][1]
        if (rowIdx < 0 || rowIdx > this.KEYBOARD_HEIGHT - 1) continue
        if (colIdx < 0 || colIdx > this.KEYBOARD_WIDTH - 1) continue
        const target = this.keyboard[rowIdx][colIdx]
        if (target != null && target.side != piece.side && target.type == 'king') {
          // console.log("the checkmate is confirmed and is directly caused by the new move")
          return target
        }
      }

      return null
    }

    addHistory (piece, newCoordinate) {
      // console.log('history added')
      const [nRow, nCol] = newCoordinate

      const tempPiece = piece
      const tempCoor = piece.coordinate
      const tempPiece2 = this.keyboard[nRow][nCol]
      const tempCoor2 = newCoordinate
      const currSide = this.currSide
      const tempMoved = piece.moved
      const currCheckmatePiece = this.checkmatePiece
      this.history.push([tempPiece, tempCoor, tempMoved, tempPiece2, tempCoor2, currSide, currCheckmatePiece])
    }

    undoHistory () {
      // console.log('history undoing')
      if (this.status === 'ended') return

      if (this.moveRecord.length > 0) {
        const count = this.moveRecord.pop()

        for (let idx = 0; idx < count; idx++) {
          const [piece, coordinate, moved, piece2, coordinate2, currSide, currCheckmatePiece] = this.history.pop()
          this.removeFromKeyboard(piece)
          piece.coordinate = coordinate
          piece.moved = moved
          this.addToKeyboard(piece)

          const [row2, col2] = coordinate2
          this.keyboard[row2][col2] = piece2

          this.currSide = currSide
          this.checkmatePiece = currCheckmatePiece
        }
      }
    }

    updateCheckmatePiece (king) {
      this.checkmatePiece = king
    }

    varifyMoveByCheckmate () {
      // console.log('varifyMoveByCheckmate')
      let result = true

      const king = this.currSide == 'white' ? this.whiteKing : this.blackKing
      if (this.checkIfInDanger(king) != null) {
        if (this.checkmatePiece == null) {
          // console.log('this move lead to self checkmate, move denied')
          this.addText('this move lead to self checkmate, move denied')
        } else if (this.checkmatePiece != null) {
          // console.log('the move did not resolve the current checkmate, move denied')
          this.addText('the move did not resolve the current checkmate, move denied')
        }
        result = false
      } else if (this.checkmatePiece != null) {
        // console.log('the move did resolved the current checkmate')
        this.addText('the move did resolved the current checkmate')
        this.updateCheckmatePiece(null)
      }
      if (result == true) {
        // console.log('start checking checkmate')
        const oppisiteKing = this.currSide == 'white' ? this.blackKing : this.whiteKing
        const result = this.checkIfInDanger(oppisiteKing)
        if (result != null) {
          // console.log(`checkmate the ${oppisiteKing.side} king!`)
          this.addText(`checkmate the ${oppisiteKing.side} king!`)
          this.updateCheckmatePiece(oppisiteKing)
          if (this.ifGameOverIfCheckmate(oppisiteKing)) {
            this.winner = this.currSide
            this.endGame()
          }
        }
      }
      return result
    }

    ifGameOverIfCheckmate (king) {
      let result = true
      const danger = this.checkIfInDanger(king)
      const helper = this.checkIfInDanger(danger)
      // console.log('start to resolving the threat')
      this.addText('start to resolving the threat')

      if (helper == null || helper == king) {
        // console.log('no helper to kill the threat, continue resolving the threat')
        this.addText('no helper to kill the threat, continue resolving the threat')

        const steps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        for (let idx = 0; idx < steps.length; idx++) {
          const [rowStep, colStep] = steps[idx]
          let [row, col] = king.coordinate
          row += rowStep
          col += colStep
          if (row < 0 || row > this.KEYBOARD_HEIGHT - 1) continue
          if (col < 0 || col > this.KEYBOARD_WIDTH - 1) continue
          const surrounding = this.keyboard[row][col]
          if (surrounding == null || surrounding.side != king.side) {
            this.moveRecord.push(1)
            this.loadMove(king, [row, col])
            result &&= this.checkIfInDanger(king) != null
            this.undoHistory()
          }
          if (result == false) {
            // console.log('the threat can be resolved by moving the king')
            this.addText('the threat can be resolved by moving the king')
            break
          }
        }

        if (result == true) {
          // console.log('king cannot be moved, continue resolving the threat')
          this.addText('king cannot be moved, continue resolving the threat')
          if (['knight', 'pawn'].includes(danger.type)) {
            // console.log('the threat cannot be resolved by moving a piece in between the king and the threat')
            this.addText('the threat cannot be resolved by moving a piece in between the king and the threat')
            // console.log(`game over, ${king.side} side lost`)
            this.addText(`game over, ${king.side} side lost`)
          } else {
            const [kRow, kCol] = king.coordinate
            const [pRow, pCol] = danger.coordinate
            let rowStep = 0
            let colStep = 0
            if (pRow != kRow) {
              rowStep = (pRow - kRow) / Math.abs(pRow - kRow)
            }
            if (pCol != kCol) {
              colStep = (pCol - kCol) / Math.abs(pCol - kCol)
            }
            let rowIdx = kRow
            let colIdx = kCol
            while (rowIdx + rowStep != pRow || colIdx + colStep != pCol) {
              rowIdx += rowStep
              colIdx += colStep
              const target = this.checkIfSideCanMoveToCoor(king.side, [rowIdx, colIdx])
              if (target && target.type != 'king') {
                // console.log('the threat can be resolved by moving the piece in between king and the threat')
                this.addText('the threat can be resolved by moving the piece in between king and the threat')
                // console.log(`use ${target.type} at ${target.coordinate}`)
                this.addText(`use ${target.type} at ${target.coordinate}`)
                result = false
                break
              }
            }
            if (result == true) {
              // console.log('no piece can be moved in between the threat and the king')
              this.addText('no piece can be moved in between the threat and the king')
              // console.log(`game over, ${king.side} side lost`)
              this.addText(`game over, ${king.side} side lost`)
            }
          }
        }
      } else {
        // console.log('the threat can be resolved by eating the threat')
        this.addText('the threat can be resolved by eating the threat')
        // console.log(`use ${helper.type} at ${helper.coordinate}`)
        this.addText(`use ${helper.type} at ${helper.coordinate}`)
        result = false
      }
      return result
    }

    checkIfSideCanMoveToCoor (side, coordinate) {
      const keyboard = this.keyboard
      for (let row = 0; row < keyboard.length; row++) {
        for (let col = 0; col < keyboard[row].length; col++) {
          const target = keyboard[row][col]
          if (
            target &&
            target.side == side &&
            target.type != 'king' &&
            target.checkMove(coordinate, this)
          ) return target
        }
      }
      return null
    }

    endGame () {
      console.log('game ended')
      this.status = 'ended'
      clearInterval(this.timeInterval)
    }

    addText (text) {
      this.textQueue.push(text)
    }
}

class Piece {
    side = 'white'
    coordinate = [0, 0]
    type = 'pawn'
    constructor (side = 'white', coordinate = [0, 0], type) {
      this.side = side
      this.coordinate = coordinate
      this.type = type
    }

    static generatePiece (side = 'white', coordinate = [0, 0], type = 'pawn') {
      let piece
      switch (type) {
        case 'pawn':
          piece = new Pawn(side, coordinate)
          break
        case 'knight':
          piece = new Knight(side, coordinate)
          break
        case 'bishop':
          piece = new Bishop(side, coordinate)
          break
        case 'rook':
          piece = new Rook(side, coordinate)
          break
        case 'king':
          piece = new King(side, coordinate)
          break
        case 'queen':
          piece = new Queen(side, coordinate)
          break
        default:
          piece = new Pawn()
      }
      return piece
    }
}

class Pawn extends Piece {
    name = 'pawn'
    moved = false
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'pawn')
    }

    checkMove (newCoordinate, chess) {
      const keyboard = chess.keyboard
      const [nRow, nCol] = newCoordinate
      const [oRow, oCol] = this.coordinate
      let result
      if (this.side == 'white') {
        const piece = keyboard[nRow][nCol]
        result = (
          (nCol == oCol && nRow == oRow + 1) ||
          (Math.abs(nCol - oCol) == 1 && nRow == oRow + 1 && piece && piece.side != this.side) ||
          (!this.moved && nCol == oCol && nRow == oRow + 2 && oRow == 1)
        )
      }
      if (this.side == 'black') { // 7, 5   <--   6, 4
        const piece = keyboard[nRow][nCol]
        result = (
          (nCol == oCol && nRow == oRow - 1) ||
          (Math.abs(nCol - oCol) == 1 && nRow == oRow - 1 && piece && piece.side != this.side) ||
          (!this.moved && nCol == oCol && nRow == oRow - 2 && oRow == chess.KEYBOARD_HEIGHT - 2)
        )
      }
      /*
        checking for if chess should promote this pawn
        */
      if (result) {
        if (
          (this.side == 'white' && nRow == keyboard.length - 1) ||
          (this.side == 'black' && nRow == 0)
        ) {
          chess.promotion(this)
        }
      }
      return result
    }
}

class Bishop extends Piece {
    name = 'bishop'
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'bishop')
    }

    checkMove (newCoordinate, chess) {
      const [oRow, oCol] = this.coordinate
      const [nRow, nCol] = newCoordinate
      const rowDiff = Math.abs(nRow - oRow)
      const colDiff = Math.abs(nCol - oCol)
      let result = false
      if (rowDiff == colDiff && rowDiff != 0) {
        // console.log("the move meets the rule of chess for bishop")
        const piece = chess.searchDiagnalPath(this.coordinate, newCoordinate)
        if (piece == null || (piece.coordinate[0] == newCoordinate[0] && piece.coordinate[1] == newCoordinate[1])) {
          // console.log("the path is clear, move allowed")
          result = true
        }
      }
      return result
    }
}

class Knight extends Piece {
    name = 'knight'
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'knight')
    }

    checkMove (newCoordinate) {
      let nRow, nCol
      [nRow, nCol] = newCoordinate
      nRow = parseInt(nRow)
      nCol = parseInt(nCol)
      let oRow, oCol
      [oRow, oCol] = this.coordinate
      oRow = parseInt(oRow)
      oCol = parseInt(oCol)
      const result = (Math.abs(nRow - oRow) == 2 && Math.abs(nCol - oCol) == 1) || (Math.abs(nRow - oRow) == 1 && Math.abs(nCol - oCol) == 2)
      return result
    }
}

class Rook extends Piece {
    moved = false
    name = 'rook'
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'rook')
    }

    checkMove (newCoordinate, chess) {
      let result = false
      const [nRow, nCol] = newCoordinate
      const [oRow, oCol] = this.coordinate
      if ((nRow == oRow || nCol == oCol) && (nRow != oRow || nCol != oCol)) {
        // console.log("the move meets the rule of chess for rook")
        const piece = chess.searchStraightPath(this.coordinate, newCoordinate)
        if (piece == null || (piece.coordinate[0] == newCoordinate[0] && piece.coordinate[1] == newCoordinate[1])) {
          // console.log("the path is clear, move allowed")
          result = true
        }
      }
      return result
    }
}

class King extends Piece {
    moved = false
    name = 'king'
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'king')
    }

    checkMove (newCoordinate, chess) {
      const keyboard = chess.keyboard
      const [nRow, nCol] = newCoordinate
      const [oRow, oCol] = this.coordinate
      let result = (Math.abs(nRow - oRow) == 1 && nCol == oCol) ||
                    (Math.abs(nCol - oCol) == 1 && nRow == oRow) ||
                    (Math.abs(nRow - oRow) == 1 && Math.abs(nCol - oCol) == 1)
      /*
        checking for if chess should apply castling
        */
      if (this.moved == false) {
        // console.log('king have not moved')
        if (nRow == oRow && (keyboard[0].length - 1 - nCol == 1 || nCol == 1)) {
          // console.log('destination make sence')
          let rook = new Rook(this.side, this.coordinate)
          if (rook.checkMove(newCoordinate, chess)) {
            // console.log('path to destination is clear')
            rook = null
            const colStep = (nCol - oCol) / Math.abs(nCol - oCol)
            const piece = chess.keyboard[nRow][nCol + colStep]
            if (piece && piece.type == 'rook' && piece.moved == false) {
              // console.log('the rook is also elligable')
              // chess.castling(this, piece)
              result = ['castling', this, piece]
            }
          }
        }
      }
      return result
    }
}

class Queen extends Piece {
    name = 'queen'
    constructor (side = 'white', coordinate = [0, 0]) {
      super(side, coordinate, 'queen')
    }

    checkMove (newCoordinate, chess) {
      const [nRow, nCol] = newCoordinate
      const [oRow, oCol] = this.coordinate
      const rowDiff = Math.abs(nRow - oRow)
      const colDiff = Math.abs(nCol - oCol)
      let result = false
      if ((nRow == oRow || nCol == oCol) && (nRow != oRow || nCol != oCol)) {
        // console.log("the move meets the rule of chess for queen")
        const piece = chess.searchStraightPath(this.coordinate, newCoordinate)
        if (piece == null || (piece.coordinate[0] == newCoordinate[0] && piece.coordinate[1] == newCoordinate[1])) {
          // console.log("the path is clear, move allowed")
          result = true
        }
      }
      if (rowDiff == colDiff && rowDiff != 0) {
        // console.log("the move meets the rule of chess for queen")
        const piece = chess.searchDiagnalPath(this.coordinate, newCoordinate)
        if (piece == null || (piece.coordinate[0] == newCoordinate[0] && piece.coordinate[1] == newCoordinate[1])) {
          // console.log("the path is clear, move allowed")
          result = true
        }
      }
      return result
    }
}

export {
  Chess
}
