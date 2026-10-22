import assert from 'node:assert/strict'
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  extractCode,
  isCode,
  newCode,
  normalizeCode,
} from './src/room-code.ts'

assert.equal(CODE_ALPHABET.length, 32, 'newCode masks bytes to 5 bits')

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

assert.equal(extractCode('ABC234'), 'ABC234')
assert.equal(extractCode('abc-234'), 'ABC234')
assert.equal(extractCode('https://example.com/app/?room=ABC234'), 'ABC234')
assert.equal(extractCode('https://example.com/app/?room=abc-234&foo=bar'), 'ABC234')
assert.equal(extractCode('https://example.com/app/'), '')

console.log('ok')
