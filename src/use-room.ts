import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import Peer, { type DataConnection, type PeerJSOption } from 'peerjs'
import { newCode } from '@/room-code'

export const MAX_PEERS = 8
export const MAX_NICK = 20
export const MAX_TEXT = 2000

/** Namespaces our room codes inside the shared public broker. */
const ID_PREFIX = 'webrtc-chat-'

const env = import.meta.env
const PEER_OPTIONS: PeerJSOption = env.VITE_PEER_HOST
  ? {
      host: env.VITE_PEER_HOST,
      port: Number(env.VITE_PEER_PORT ?? 443),
      path: env.VITE_PEER_PATH ?? '/',
    }
  : {}

const PEER_ERRORS: Record<string, string> = {
  'browser-incompatible': 'This browser does not support WebRTC.',
  'peer-unavailable': 'No room with that code.',
  'unavailable-id': 'Could not reserve a room code. Try again.',
  network: 'Lost connection to the signalling server.',
  'server-error': 'The signalling server is unavailable.',
  'ssl-unavailable': 'The signalling server is unavailable.',
}

export type User = { id: string; nick: string }

export type Message =
  | { kind: 'chat'; id: string; from: string; nick: string; text: string; ts: number }
  | { kind: 'system'; id: string; text: string; ts: number }

/** Host relays everything, so guests only ever send `chat`. */
type Wire =
  | { t: 'chat'; text: string }
  | { t: 'msg'; m: Message }
  | { t: 'history'; messages: Message[] }
  | { t: 'roster'; users: User[] }
  | { t: 'reject'; reason: string }

type Status = 'idle' | 'connecting' | 'open'

const chat = (from: string, nick: string, text: string): Message => ({
  kind: 'chat',
  id: nanoid(),
  from,
  nick,
  text,
  ts: Date.now(),
})

const system = (text: string): Message => ({ kind: 'system', id: nanoid(), text, ts: Date.now() })

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)

const randomNick = () => `user-${Math.floor(1000 + Math.random() * 9000)}`

export function useRoom() {
  const [status, setStatus] = useState<Status>('idle')
  const [code, setCode] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [selfId, setSelfId] = useState('')

  const peerRef = useRef<Peer | null>(null)
  const hostConnRef = useRef<DataConnection | null>(null)
  const guestsRef = useRef(new Map<string, { conn: DataConnection; nick: string }>())
  const nickRef = useRef('')
  const messagesRef = useRef<Message[]>([])

  const append = useCallback((m: Message) => {
    messagesRef.current = [...messagesRef.current, m]
    setMessages(messagesRef.current)
  }, [])

  const reset = useCallback(() => {
    // Detach first: destroy() fires close handlers synchronously, which must see the room as gone.
    const peer = peerRef.current
    peerRef.current = null
    peer?.destroy()
    hostConnRef.current = null
    guestsRef.current.clear()
    messagesRef.current = []
    setStatus('idle')
    setCode('')
    setMessages([])
    setUsers([])
    setSelfId('')
  }, [])

  /** Destroys the peer, so a second failure on the same connection is a no-op. */
  const fail = useCallback(
    (reason: string) => {
      if (!peerRef.current) return
      reset()
      setError(reason)
    },
    [reset],
  )

  useEffect(() => () => void peerRef.current?.destroy(), [])

  // --- Host ---

  const broadcast = useCallback((w: Wire) => {
    for (const { conn } of guestsRef.current.values()) if (conn.open) conn.send(w)
  }, [])

  const publish = useCallback(
    (m: Message) => {
      append(m)
      broadcast({ t: 'msg', m })
    },
    [append, broadcast],
  )

  const syncRoster = useCallback(() => {
    const list: User[] = [
      { id: peerRef.current?.id ?? '', nick: nickRef.current },
      ...[...guestsRef.current].map(([id, g]) => ({ id, nick: g.nick })),
    ]
    setUsers(list)
    broadcast({ t: 'roster', users: list })
  }, [broadcast])

  const acceptGuest = useCallback(
    (conn: DataConnection) => {
      const nick = clean((conn.metadata as { nick?: unknown } | null)?.nick, MAX_NICK)

      conn.on('open', () => {
        const reason = !nick
          ? 'Invalid nickname.'
          : guestsRef.current.size + 1 >= MAX_PEERS
            ? 'This room is full.'
            : ''
        if (reason) {
          conn.send({ t: 'reject', reason } satisfies Wire)
          conn.close({ flush: true })
          return
        }
        guestsRef.current.set(conn.peer, { conn, nick })
        conn.send({ t: 'history', messages: messagesRef.current } satisfies Wire)
        syncRoster()
        publish(system(`${nick} joined`))
      })

      conn.on('data', (data) => {
        const w = data as Wire
        // Nickname comes from the roster, never the message, so guests cannot spoof each other.
        const sender = guestsRef.current.get(conn.peer)
        if (w?.t !== 'chat' || !sender) return
        const text = clean(w.text, MAX_TEXT)
        if (text) publish(chat(conn.peer, sender.nick, text))
      })

      conn.on('close', () => {
        if (!guestsRef.current.delete(conn.peer)) return
        syncRoster()
        publish(system(`${nick} left`))
      })
    },
    [publish, syncRoster],
  )

  const startHost = useCallback(
    function attempt(roomCode: string, retriesLeft: number) {
      const peer = new Peer(ID_PREFIX + roomCode, PEER_OPTIONS)
      peerRef.current = peer
      peer.on('open', (id) => {
        setSelfId(id)
        setCode(roomCode)
        setStatus('open')
        syncRoster()
      })
      peer.on('connection', acceptGuest)
      peer.on('error', (err) => {
        if (peerRef.current !== peer) return
        if (err.type === 'unavailable-id' && retriesLeft > 0) {
          peer.destroy()
          attempt(newCode(), retriesLeft - 1)
          return
        }
        fail(PEER_ERRORS[err.type] ?? 'Connection failed.')
      })
    },
    [acceptGuest, fail, syncRoster],
  )

  // --- Guest ---

  const startGuest = useCallback(
    (roomCode: string) => {
      const peer = new Peer(PEER_OPTIONS)
      peerRef.current = peer
      peer.on('open', (id) => {
        setSelfId(id)
        const conn = peer.connect(ID_PREFIX + roomCode, {
          metadata: { nick: nickRef.current },
          serialization: 'json',
        })
        hostConnRef.current = conn
        conn.on('open', () => {
          setCode(roomCode)
          setStatus('open')
        })
        conn.on('data', (data) => {
          const w = data as Wire
          if (w?.t === 'msg') append(w.m)
          else if (w?.t === 'roster') setUsers(w.users)
          else if (w?.t === 'reject') fail(w.reason)
          else if (w?.t === 'history') {
            messagesRef.current = w.messages
            setMessages(w.messages)
          }
        })
        conn.on('close', () => fail('The host ended the room.'))
      })
      peer.on('error', (err) => fail(PEER_ERRORS[err.type] ?? 'Connection failed.'))
    },
    [append, fail],
  )

  // --- Public API ---

  const enter = useCallback(
    (nick: string, roomCode: string | null) => {
      nickRef.current = clean(nick, MAX_NICK) || randomNick()
      setError('')
      setStatus('connecting')
      if (roomCode) startGuest(roomCode)
      else startHost(newCode(), 1)
    },
    [startGuest, startHost],
  )

  const clearError = useCallback(() => setError(''), [])

  const send = useCallback(
    (text: string) => {
      const body = clean(text, MAX_TEXT)
      if (!body || !peerRef.current) return
      if (hostConnRef.current) hostConnRef.current.send({ t: 'chat', text: body } satisfies Wire)
      else publish(chat(peerRef.current.id, nickRef.current, body))
    },
    [publish],
  )

  return {
    status,
    code,
    messages,
    users,
    error,
    selfId,
    create: (nick: string) => enter(nick, null),
    join: (nick: string, roomCode: string) => enter(nick, roomCode),
    leave: reset,
    send,
    clearError,
  }
}
