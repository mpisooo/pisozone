import { useState, useEffect } from 'react'
import { ArrowLeft, Ban, Flag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getLevelDef } from '../../lib/levels'
import { ACTIVITY_OPTIONS } from '../../lib/constants'
import common from '../../lib/i18n/common'
import social from '../../lib/i18n/social'
import ActivityIcon from '../ActivityIcon'
import ActionSheet from './ActionSheet'

// ── Friend Profile View ───────────────────────────────────────────────────────
interface Props {
  userId: string
  username: string
  photo: string | null
  friendshipId?: string
  isFriend: boolean
  isPendingSent: boolean
  isPendingReceived: boolean
  onBack: () => void
  onSendRequest: (id: string) => Promise<void>
  onAcceptRequest: (fid: string) => Promise<void>
  onRemove: (fid: string) => Promise<void>
  onBlock: (id: string) => Promise<{ error: Error | null }>
  onReport: (id: string, reason: string) => Promise<{ error: Error | null }>
}

export default function FriendProfileView({
  userId, username, photo, friendshipId, isFriend, isPendingSent, isPendingReceived, onBack,
  onSendRequest, onAcceptRequest, onRemove, onBlock, onReport,
}: Props) {
  const [remoteProfile, setRemoteProfile] = useState<any>(null)
  const [acting, setActing] = useState(false)
  const [showReportSheet, setShowReportSheet] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [modMsg, setModMsg] = useState('')

  const handleBlock = async () => {
    if (!confirmBlock) { setConfirmBlock(true); return }
    setActing(true)
    const { error } = await onBlock(userId)
    setActing(false)
    if (error) {
      setModMsg(social.friends.profile.blockFailedMsg)
      setConfirmBlock(false)
      setTimeout(() => setModMsg(''), 3000)
      return
    }
    onBack()
  }

  const handleReport = async (reason: string) => {
    setShowReportSheet(false)
    const { error } = await onReport(userId, reason)
    setModMsg(error ? social.friends.profile.reportFailedMsg : social.friends.profile.reportSentMsg)
    setTimeout(() => setModMsg(''), 3500)
  }

  useEffect(() => {
    supabase.from('profiles').select('username, name, photo_url, level, sport_preferiti').eq('id', userId).single()
      .then(({ data }) => setRemoteProfile(data))
  }, [userId])

  // Statistiche pubbliche (v37): solo aggregati via RPC security definer,
  // mai attività grezze. Tollerante pre-migrazione: errore → griglia nascosta.
  const [pubStats, setPubStats] = useState<{ total_activities: number; total_minutes: number; total_km: number; medals: number } | null>(null)
  useEffect(() => {
    supabase.rpc('get_public_profile_stats', { p_user_id: userId }).then(({ data, error }) => {
      const row = Array.isArray(data) ? data[0] : data
      if (!error && row) {
        setPubStats({
          total_activities: Number(row.total_activities),
          total_minutes: Number(row.total_minutes),
          total_km: Number(row.total_km),
          medals: Number(row.medals),
        })
      }
    })
  }, [userId])

  // "Io vs te" (v44): aggregati della settimana in corso per me e per l'amico
  // via RPC — due righe, una per testa. Solo tra amici accettati (la RPC
  // stessa non risponde per gli estranei); tollerante pre-migrazione:
  // errore o righe mancanti → card nascosta.
  type WeeklySide = { sessions: number; minutes: number; km: number; kcal: number }
  const [weeklyVs, setWeeklyVs] = useState<{ me: WeeklySide; friend: WeeklySide } | null>(null)
  useEffect(() => {
    if (!isFriend) { setWeeklyVs(null); return }
    supabase.rpc('get_weekly_comparison', { p_friend_id: userId }).then(({ data, error }) => {
      if (error || !Array.isArray(data)) return
      const toSide = (r: any): WeeklySide => ({
        sessions: Number(r.sessions), minutes: Number(r.minutes), km: Number(r.km), kcal: Number(r.kcal),
      })
      const meRow = data.find((r: any) => r.user_id !== userId)
      const friendRow = data.find((r: any) => r.user_id === userId)
      if (meRow && friendRow) setWeeklyVs({ me: toSide(meRow), friend: toSide(friendRow) })
    })
  }, [userId, isFriend])

  const ld = getLevelDef(remoteProfile?.level ?? 1)
  const sports = (remoteProfile?.sport_preferiti ?? []).map((s: string) => ACTIVITY_OPTIONS.find(o => o.value === s)).filter(Boolean)

  const handleAction = async () => {
    setActing(true)
    if ((isFriend || isPendingSent) && friendshipId) await onRemove(friendshipId)
    else if (isPendingReceived && friendshipId) await onAcceptRequest(friendshipId)
    else await onSendRequest(userId)
    setActing(false)
    onBack()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--grey)]">
        <button type="button" onClick={onBack} aria-label={common.back} className="p-1 -ml-1 text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <p className="font-bebas text-xl text-white tracking-wider">{social.friends.profile.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[var(--red)]">
            {photo
              ? <img src={photo} className="w-full h-full object-cover" alt={username} />
              : <span className="font-bebas text-3xl text-[white]">{username[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-lg">@{username}</p>
            {remoteProfile?.name && <p className="text-sm text-gray-400">{remoteProfile.name}</p>}
            <p className="text-sm font-semibold mt-1" style={{ color: ld.color }}>
              {ld.emoji} {social.shared.levelPrefix}{remoteProfile?.level ?? 1} — {ld.title}
            </p>
          </div>
          <button
            onClick={handleAction}
            disabled={acting}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={
              isFriend ? { border: '1px solid #7f1d1d', color: '#f87171' }
              : isPendingSent ? { background: 'var(--grey)', color: '#9ca3af' }
              : isPendingReceived ? { background: '#22c55e', color: '#fff' }
              : { background: 'var(--red)', color: '#fff' }
            }
          >
            {isFriend ? social.friends.profile.removeFriendButton : isPendingSent ? social.friends.profile.pendingSentButton : isPendingReceived ? social.friends.profile.acceptRequestButton : social.friends.profile.addFriendButton}
          </button>
        </div>

        {/* Profilo pubblico presentabile (v37): la card "In numeri" */}
        {pubStats && pubStats.total_activities > 0 && (
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{social.friends.profile.statsHeading}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                [String(pubStats.total_activities), social.friends.profile.statActivities],
                [`${Math.round(pubStats.total_minutes / 60)}h`, social.friends.profile.statHours],
                [(Math.round(pubStats.total_km * 10) / 10).toLocaleString('it-IT'), social.friends.profile.statKm],
                [String(pubStats.medals), social.friends.profile.statMedals],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-bebas text-2xl text-white leading-none">{value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* "Io vs te" (v44): la settimana in corso, tu contro l'amico. La barra
            è un tiro alla fune — la quota rossa è la tua parte del totale. */}
        {weeklyVs && (
          <div className="card">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{social.friends.profile.vsHeading}</p>
              <p className="text-[10px] text-gray-600">{social.friends.profile.vsSubtitle}</p>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--red)' }}>
                {social.friends.profile.vsYouLabel}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">@{username}</span>
            </div>
            <div className="space-y-3">
              {([
                [social.friends.profile.vsMetricSessions, weeklyVs.me.sessions, weeklyVs.friend.sessions, 0],
                [social.friends.profile.vsMetricMinutes, weeklyVs.me.minutes, weeklyVs.friend.minutes, 0],
                [social.friends.profile.vsMetricKm, weeklyVs.me.km, weeklyVs.friend.km, 1],
                [social.friends.profile.vsMetricKcal, weeklyVs.me.kcal, weeklyVs.friend.kcal, 0],
              ] as [string, number, number, number][]).map(([label, mine, theirs, decimals]) => {
                const share = mine + theirs > 0 ? (mine / (mine + theirs)) * 100 : 50
                const fmt = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: decimals })
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white tabular-nums">{fmt(mine)}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
                      <span className="text-sm text-gray-400 tabular-nums">{fmt(theirs)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${share}%`, background: 'var(--red)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {sports.length > 0 && (
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{social.friends.profile.favoriteSportsHeading}</p>
            <div className="flex gap-4">
              {sports.map((s: any) => (
                <div key={s.value} className="flex flex-col items-center gap-1">
                  <ActivityIcon type={s.value} className="text-[var(--red)]" />
                  <span className="text-[10px] text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderazione: segnala / blocca */}
        <div className="card space-y-2.5">
          {modMsg && (
            <p className="text-xs text-center rounded-lg py-2 px-3" style={{ background: 'var(--grey)', color: 'var(--color-text)' }}>
              {modMsg}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowReportSheet(true)}
              disabled={acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium tap disabled:opacity-50"
              style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
            >
              <Flag size={13} /> {social.friends.profile.reportButton}
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium tap disabled:opacity-50"
              style={{
                border: '1px solid rgba(var(--accent-rgb),0.5)',
                color: 'var(--red)',
                background: confirmBlock ? 'rgba(var(--accent-rgb),0.15)' : 'transparent',
              }}
            >
              <Ban size={13} /> {confirmBlock ? social.friends.profile.confirmBlockButton : social.friends.profile.blockButton}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            {social.friends.profile.blockWarning(username)}
          </p>
        </div>
      </div>

      {showReportSheet && (
        <ActionSheet onClose={() => setShowReportSheet(false)} label={social.friends.profile.reportSheetLabel}>
          <div className="px-4 pt-4 pb-2 border-b border-[var(--grey)]">
            <p className="text-sm font-semibold text-white">{social.friends.profile.reportSheetQuestion(username)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{social.friends.profile.reportSheetHint}</p>
          </div>
          {social.friends.profile.reportReasons.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => handleReport(r)}
              className="w-full text-left px-4 py-3.5 text-sm text-gray-300 active:bg-[var(--grey)]"
            >
              {r}
            </button>
          ))}
        </ActionSheet>
      )}
    </div>
  )
}
