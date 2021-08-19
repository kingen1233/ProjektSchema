const { describe, it } = require('mocha')
const assert = require('assert')
const helpers = require('../src/helpers')

describe('initMatrix()', () => {
  it('should initialize matrix with given dimensions', () => {
    const rows = 5
    const cols = 6
    const matrix = helpers.initMatrix(rows, cols)

    assert.strictEqual(matrix.length, rows)
    matrix.forEach(row => {
      assert.strictEqual(row.length, cols)
    })
  })

  it('should default all cells to undefined', () => {
    const rows = 5
    const cols = 6
    const matrix = helpers.initMatrix(rows, cols)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        assert.strictEqual(matrix[i][j], undefined)
      }
    }
  })

  it('should populate cell values according to given function (without args)', () => {
    const rows = 5
    const cols = 6
    const matrix = helpers.initMatrix(rows, cols, () => 666)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        assert.strictEqual(matrix[i][j], 666)
      }
    }
  })

  it('should populate cell values according to given function (with args)', () => {
    const rows = 5
    const cols = 6
    const matrix = helpers.initMatrix(rows, cols, (i, j) => i * j)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        assert.strictEqual(matrix[i][j], i * j)
      }
    }
  })
})
