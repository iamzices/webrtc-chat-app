import { customAlphabet } from 'nanoid'

/** Excludes I, O, 0 and 1 so codes survive being read aloud or retyped. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)
const NOISE_RE = new RegExp(`[^${CODE_ALPHABET}]`, 'g')

export const newCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH)

/** Makes pasted or hand-typed input comparable: uppercase, drop noise, cap length. */
export const normalizeCode = (input: string) =>
  input.toUpperCase().replace(NOISE_RE, '').slice(0, CODE_LENGTH)

export const isCode = (input: string) => CODE_RE.test(input)
