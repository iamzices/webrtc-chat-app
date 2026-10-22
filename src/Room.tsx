import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CopyIcon, LogOutIcon, SendHorizontalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { roomUrl } from '@/room-code'
import { MAX_PEERS, MAX_TEXT, type Message, type User } from '@/use-room'

const initials = (nick: string) => nick.slice(0, 2).toUpperCase()

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <>
      <Button
        variant="outline"
        className="font-mono tracking-[0.2em]"
        aria-label={`Room code ${code.split('').join(' ')}. Copy invite link.`}
        onClick={() =>
          navigator.clipboard
            .writeText(roomUrl(code))
            .then(() => setCopied(true))
            .catch(() => toast.error('Could not copy the invite link.'))
        }
      >
        {code}
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      {/* The button's label is fixed, so announce the copy separately. */}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Invite link copied' : ''}
      </span>
    </>
  )
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  if (message.kind === 'system')
    return (
      <p className="text-center text-xs text-muted-foreground">
        {message.text} · {time(message.ts)}
      </p>
    )

  return (
    <div className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
      <Avatar size="sm">
        <AvatarFallback>{initials(message.nick)}</AvatarFallback>
      </Avatar>
      <div className={cn('flex max-w-[75%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        <p className="px-1 text-xs text-muted-foreground">
          {mine ? 'You' : message.nick} · {time(message.ts)}
        </p>
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm wrap-anywhere',
            mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {message.text}
        </p>
      </div>
    </div>
  )
}

export function Room({
  code,
  messages,
  users,
  selfId,
  onSend,
  onLeave,
}: {
  code: string
  messages: Message[]
  users: User[]
  selfId: string
  onSend: (text: string) => void
  onLeave: () => void
}) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="flex flex-wrap items-center gap-3 p-4">
        <CopyCode code={code} />
        <AvatarGroup>
          {users.map((u) => (
            <Avatar key={u.id} size="sm" title={u.nick}>
              <AvatarFallback>{initials(u.nick)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <Badge variant="secondary">
          {users.length}/{MAX_PEERS}
        </Badge>
        <Button variant="ghost" size="icon" className="ml-auto" aria-label="Leave room" onClick={onLeave}>
          <LogOutIcon />
        </Button>
      </header>
      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {messages.map((m) => (
            <Bubble key={m.id} message={m} mine={m.kind === 'chat' && m.from === selfId} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="flex gap-2 border-t p-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSend(draft)
          setDraft('')
        }}
      >
        <Input
          autoFocus
          value={draft}
          maxLength={MAX_TEXT}
          placeholder="Write a message"
          aria-label="Message"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send">
          <SendHorizontalIcon />
        </Button>
      </form>
    </div>
  )
}
