import { useState, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useComments, type ActivityComment } from '../../hooks/useComments'
import social from '../../lib/i18n/social'
import Av from './Av'

// ── Commenti di un'attività del feed ─────────────────────────────────────────
interface Props {
  activityId: string
  ownerId: string
  myId: string
  onCountChange: (id: string, n: number) => void
}

export default function FeedComments({ activityId, ownerId, myId, onCountChange }: Props) {
  const { fetchComments, addComment, deleteComment } = useComments()
  const [comments, setComments] = useState<ActivityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchComments(activityId).then(c => {
      if (cancelled) return
      setComments(c)
      setLoading(false)
      onCountChange(activityId, c.length)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const added = await addComment(activityId, text)
    setSending(false)
    if (added) {
      setComments(prev => { onCountChange(activityId, prev.length + 1); return [...prev, added] })
      setText('')
    }
  }

  const handleDelete = async (id: string) => {
    if (await deleteComment(id)) {
      setComments(prev => { onCountChange(activityId, prev.length - 1); return prev.filter(c => c.id !== id) })
    }
  }

  return (
    <div className="space-y-2.5 pt-2 border-t border-[var(--grey)]">
      {loading ? (
        <p className="text-xs text-gray-500">{social.feed.comments.loading}</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500">{social.feed.comments.empty}</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <Av photo={c.user_photo} name={c.username} size={26} />
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-semibold text-white">{c.username}</span>{' '}
                <span className="text-gray-500">{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: it })}</span>
              </p>
              <p className="text-sm text-gray-300 break-words">{c.content}</p>
            </div>
            {(c.user_id === myId || ownerId === myId) && (
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                aria-label={social.feed.comments.deleteAria}
                className="p-1 text-gray-600 hover:text-[var(--red)] flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))
      )}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          maxLength={500}
          placeholder={social.feed.comments.inputPlaceholder}
          className="input-dark flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label={social.feed.comments.sendAria}
          className="p-2.5 rounded-lg bg-[var(--red)] text-[white] disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
