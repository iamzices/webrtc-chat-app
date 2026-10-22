import { useState } from 'react'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/sonner'
import { CODE_LENGTH, ROOM_PARAM, extractCode, isCode } from '@/room-code'
import { MAX_NICK, useRoom } from '@/use-room'
import { Room } from '@/Room'

type View = 'landing' | 'join'

const codeFromUrl = () =>
  extractCode(new URLSearchParams(window.location.search).get(ROOM_PARAM) ?? '')

export default function App() {
  const room = useRoom()
  const [nick, setNick] = useState('')
  const [code, setCode] = useState(codeFromUrl)
  const [view, setView] = useState<View>(code ? 'join' : 'landing')

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
            <CardContent>
              {/* One form, so Enter in either field submits the current view's action. */}
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (view === 'landing') room.create(nick)
                  else room.join(nick, code)
                }}
              >
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
                    <Button type="submit" className="flex-1" disabled={busy}>
                      {busy && <Loader2Icon className="animate-spin" />}
                      Create room
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setView('join')}
                    >
                      Join room
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      <Toaster position="top-center" />
    </>
  )
}
