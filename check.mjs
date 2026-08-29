import assert from 'node:assert/strict'
import { CODE_ALPHABET, CODE_LENGTH, isCode, newCode, normalizeCode } from './src/room-code.ts'

for (let i = 0; i < 1000; i++) {
  const code = newCode()
  assert.equal(code.length, CODE_LENGTH)
  assert.ok([...code].every((c) => CODE_ALPHABET.includes(c)), `bad character in ${code}`)
  assert.ok(isCode(code))
  assert.equal(normalizeCode(code), code)
}

assert.equal(normalizeCode('abc-234'), 'ABC234')
assert.equal(normalizeCode('  a b c 2 3 4  '), 'ABC234')
assert.equal(normalizeCode('AB01IO'), 'AB') // ambiguous characters are dropped, not mapped
assert.equal(normalizeCode('ABC234XYZ'), 'ABC234')

assert.ok(!isCode(''))
assert.ok(!isCode('ABC23'))
assert.ok(!isCode('ABC2345'))
assert.ok(!isCode('abc234'))
assert.ok(!isCode('ABC01O'))

console.log('ok')
