import { supabase } from '../lib/supabase'
import { isRateLimitError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import social from '../lib/i18n/social'

export interface ActivityComment {
  id: string
  activity_id: string
  user_id: string
  content: string
  created_at: string
  username: string
  user_photo: string | null
}

interface CommentRow {
  id: string
  activity_id: string
  user_id: string
  content: string
  created_at: string
  profile: { username: string; photo_url: string | null } | null
}

// Commenti sulle attività del feed (v26). La RLS limita lettura e scrittura a
// proprietario dell'attività e suoi amici, blocchi esclusi.
export function useComments() {
  const { user } = useAuth()
  const { showError } = useToast()

  const fetchComments = async (activityId: string): Promise<ActivityComment[]> => {
    const { data, error } = await supabase
      .from('activity_comments')
      .select('id, activity_id, user_id, content, created_at, profile:profiles!user_id(username, photo_url)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })
    if (error) return []
    return ((data ?? []) as unknown as CommentRow[]).map((c) => ({
      id: c.id,
      activity_id: c.activity_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      username: c.profile?.username ?? 'Utente',
      user_photo: c.profile?.photo_url ?? null,
    }))
  }

  const addComment = async (activityId: string, content: string): Promise<ActivityComment | null> => {
    if (!user || !content.trim()) return null
    const { data, error } = await supabase
      .from('activity_comments')
      .insert({ activity_id: activityId, user_id: user.id, content: content.trim() })
      .select('id, activity_id, user_id, content, created_at')
      .single()
    if (error || !data) {
      if (isRateLimitError(error)) showError(social.feed.comments.errors.rateLimited)
      else showError(social.feed.comments.errors.sendFailed)
      return null
    }
    return {
      ...data,
      username: (user.user_metadata?.username as string) ?? 'Tu',
      user_photo: null,
    }
  }

  const deleteComment = async (commentId: string): Promise<boolean> => {
    const { error } = await supabase.from('activity_comments').delete().eq('id', commentId)
    if (error) showError(social.feed.comments.errors.deleteFailed)
    return !error
  }

  // Conteggi per un insieme di attività (per i badge nel feed)
  const fetchCommentCounts = async (activityIds: string[]): Promise<Map<string, number>> => {
    const counts = new Map<string, number>()
    if (!activityIds.length) return counts
    const { data } = await supabase
      .from('activity_comments')
      .select('activity_id')
      .in('activity_id', activityIds)
    for (const row of data ?? []) {
      counts.set(row.activity_id, (counts.get(row.activity_id) ?? 0) + 1)
    }
    return counts
  }

  return { fetchComments, addComment, deleteComment, fetchCommentCounts }
}
