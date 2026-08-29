import { useEffect, useState } from 'react'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/sonner'
import { CODE_LENGTH, ROOM_PARAM, extractCode, isCode } from '@/room-code'
import { MAX_NICK, useRoom } from '@/use-room'
import { Room } from '@/Room'

type View = 'landing' | 'join'

function codeFromUrl() {
  const code = extractCode(new URLSearchParams(window.location.search).get(ROOM_PARAM) ?? '')
  if (code) window.history.replaceState(null, '', window.location.pathname)
  return code
}

export default function App() {
  const room = useRoom()
  const [nick, setNick] = useState('')
  const [code, setCode] = useState(codeFromUrl)
  const [view, setView] = useState<View>(code ? 'join' : 'landing')

  const { error, clearError } = room
  useEffect(() => {
    if (!error) return
    toast.error(error)
    clearError()
  }, [error, clearError])

  const busy = room.status === 'connecting'

  return (
    <>
      {room.status === 'open' ? (
        <Room
          code={room.code}
          messages={room.messages}
          users={room.users}
          selfId={room.selfId}
          onSend={room.send}
          onLeave={room.leave}
        />
      ) : (
        <div className="flex min-h-dvh items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>WebRTC Chat App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nick">Nickname</Label>
                <Input
                  id="nick"
                  autoFocus
                  value={nick}
                  maxLength={MAX_NICK}
                  onChange={(e) => setNick(e.target.value)}
                />
              </div>

              {view === 'landing' ? (
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={() => room.create(nick)}>
                    {busy && <Loader2Icon className="animate-spin" />}
                    Create room
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setView('join')}
                  >
                    Join room
                  </Button>
                </div>
              ) : (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    room.join(nick, code)
                  }}
                >
                  <Label htmlFor="code">Room code</Label>
                  <Input
                    id="code"
                    autoFocus
                    value={code}
                    className="text-center font-mono tracking-[0.3em]"
                    placeholder={'·'.repeat(CODE_LENGTH)}
                    onChange={(e) => setCode(extractCode(e.target.value))}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={busy}
                      aria-label="Back"
                      onClick={() => setView('landing')}
                    >
                      <ArrowLeftIcon />
                    </Button>
                    <Button type="submit" className="flex-1" disabled={busy || !isCode(code)}>
                      {busy && <Loader2Icon className="animate-spin" />}
                      Join room
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Toaster position="top-center" />
    </>
  )
}
