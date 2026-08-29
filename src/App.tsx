import { useEffect, useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { CODE_LENGTH, isCode, normalizeCode } from '@/room-code'
import { MAX_NICK, MAX_PEERS, useRoom } from '@/use-room'
import { Room } from '@/Room'

export default function App() {
  const room = useRoom()
  const [nick, setNick] = useState('')
  const [code, setCode] = useState('')

  const { error, clearError } = room
  useEffect(() => {
    if (!error) return
    toast.error(error)
    clearError()
  }, [error, clearError])

  const busy = room.status === 'connecting'
  const ready = nick.trim().length > 0 && !busy

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
              <CardDescription>
                Browser-to-browser chat for up to {MAX_PEERS} people. Nothing is stored.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nick">Nickname</Label>
                <Input
                  id="nick"
                  autoFocus
                  value={nick}
                  maxLength={MAX_NICK}
                  placeholder="Alex"
                  onChange={(e) => setNick(e.target.value)}
                />
              </div>

              <Tabs defaultValue="create">
                <TabsList className="w-full">
                  <TabsTrigger value="create">Create room</TabsTrigger>
                  <TabsTrigger value="join">Join room</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-4">
                  <Button className="w-full" disabled={!ready} onClick={() => room.create(nick)}>
                    {busy && <Loader2Icon className="animate-spin" />}
                    Create room
                  </Button>
                </TabsContent>

                <TabsContent value="join" className="mt-4">
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
                      value={code}
                      className="text-center font-mono tracking-[0.3em]"
                      placeholder={'·'.repeat(CODE_LENGTH)}
                      onChange={(e) => setCode(normalizeCode(e.target.value))}
                    />
                    <Button type="submit" className="w-full" disabled={!ready || !isCode(code)}>
                      {busy && <Loader2Icon className="animate-spin" />}
                      Join room
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      <Toaster position="top-center" />
    </>
  )
}
