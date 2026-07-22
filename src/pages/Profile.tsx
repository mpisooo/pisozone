import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, User, Lock, ChevronRight, Share2, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActivities } from '../hooks/useActivities'
import { useStreakFreeze } from '../hooks/useStreakFreeze'
import { useRecovery } from '../hooks/useRecovery'
import { useAchievements } from '../hooks/useAchievements'
import { supabase } from '../lib/supabase'
import { computeStats } from '../lib/achievementStats'
import { calcStreak } from '../lib/challenges'
import { getZoneByPercent } from '../lib/zones'
import { buildProfileShareData, shareCardImage } from '../lib/shareCard'
import { haptic } from '../lib/haptics'
import { ACTIVITY_OPTIONS, MEDALS } from '../lib/constants'
import { LEVEL_DEFINITIONS, getLevelDef, getNextLevelDef } from '../lib/levels'
import SkeletonCard from '../components/SkeletonCard'
import ActivityIcon from '../components/ActivityIcon'
import MedalIcon from '../components/MedalIcon'
import CelebrationOverlay from '../components/CelebrationOverlay'
import common from '../lib/i18n/common'
import profileText from '../lib/i18n/profile'
import shareText from '../lib/i18n/share'
import heatmapText from '../lib/i18n/heatmap'

// Roadmap v7, pilastro 01 "Non un modulo, una vetrina": questa pagina è ORA
// solo la vetrina identitaria (avatar, livello, bacheca medaglie, streak,
// sport preferiti, "in numeri") — tutta la configurazione privata (dati
// anagrafici, BMI, notifiche, lingua, temi, storico peso, guida, privacy)
// vive in Settings.tsx. Pilastro 02 "Il profilo racconta una storia": streak,
// bacheca medaglie, numeri per sport e condivisione riusano calcoli già
// esistenti altrove nel codice (Home/Calendar/Sfide, Medals.tsx), zero nuovi
// calcoli inventati qui.
export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, loading, updateProfile, refetch: refetchProfile } = useProfile()
  const { activities, loading: actsLoading } = useActivities()
  const { frozenDates } = useStreakFreeze()
  const { restDates } = useRecovery()

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [shopMsg, setShopMsg] = useState('')
  const [shopWorking, setShopWorking] = useState(false)
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ emoji: string; level: number; title: string } | null>(null)
  const [sharingProfile, setSharingProfile] = useState(false)
  const [profileShareError, setProfileShareError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && profile) setPhotoUrl(profile.photo_url)
  }, [loading, profile])

  // Card "In numeri": la stessa RPC dei profili pubblici (v37) chiamata su se
  // stessi — quello che vedono gli altri aprendo il tuo profilo. Tollerante
  // pre-migrazione: errore o zero attività → card nascosta. active_days era
  // già restituito dalla RPC ma mai letto (roadmap v7: quick win a zero
  // migrazione, si aggiunge come 5ª cifra).
  const [pubStats, setPubStats] = useState<{ total_activities: number; total_minutes: number; total_km: number; medals: number; active_days: number } | null>(null)
  useEffect(() => {
    if (!user) return
    supabase.rpc('get_public_profile_stats', { p_user_id: user.id }).then(({ data, error }) => {
      const row = Array.isArray(data) ? data[0] : data
      if (!error && row) {
        setPubStats({
          total_activities: Number(row.total_activities),
          total_minutes: Number(row.total_minutes),
          total_km: Number(row.total_km),
          medals: Number(row.medals),
          active_days: Number(row.active_days),
        })
      }
    })
  }, [user])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) {
      setUploadError(profileText.account.avatarUploadError(error.message))
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = data.publicUrl + `?t=${Date.now()}`
      setPhotoUrl(newUrl)
      await updateProfile({ photo_url: newUrl })
    }
    setUploading(false)
  }

  const showShopMsg = (msg: string) => {
    setShopMsg(msg)
    setTimeout(() => setShopMsg(''), 3000)
  }

  const handleLevelUp = async () => {
    if (!user || shopWorking) return
    setShopWorking(true)
    const { data, error } = await supabase.rpc('unlock_next_level', { p_user_id: user.id })
    setShopWorking(false)
    if (error) { showShopMsg(profileText.level.errorWithMessage(error.message)); return }
    if (!data.success) { showShopMsg(data.error ?? profileText.level.insufficientCredits); return }
    const newLevelDef = getLevelDef(data.new_level)
    setLevelUpCelebration({ emoji: newLevelDef.emoji, level: data.new_level, title: newLevelDef.title })
    await refetchProfile()
  }

  const username: string = (user?.user_metadata?.username as string) || 'Atleta'
  const currentLevel = profile?.level ?? 1
  const levelDef = getLevelDef(currentLevel)
  const nextLevel = getNextLevelDef(currentLevel)
  const credits = profile?.credits ?? 0
  const sportPreferiti = profile?.sport_preferiti ?? []

  // Streak (pilastro 02): STESSO calcStreak di Home/Calendario/Sfide, mai
  // ricalcolata a mano — freeze + giorni di riposo proteggono allo stesso modo.
  const streak = useMemo(
    () => calcStreak(activities, [...frozenDates, ...restDates]),
    [activities, frozenDates, restDates],
  )
  const streakZone = getZoneByPercent(Math.min((streak / 30) * 100, 100))

  const stats = useMemo(
    () => computeStats(activities, profile?.weekly_goal ?? 3),
    [activities, profile?.weekly_goal],
  )
  const { claimedKeys } = useAchievements(stats)
  const claimedMedals = useMemo(
    () => MEDALS.filter((m) => claimedKeys.has(m.key)),
    [claimedKeys],
  )

  const sportCounts = useMemo(
    () => Object.entries(stats.activityTypeCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) as [string, number][],
    [stats],
  )
  const maxSportCount = sportCounts[0]?.[1] ?? 1

  const hasGpsRoutes = useMemo(() => activities.some((a) => a.gps_tracked), [activities])

  const handleShareProfile = async () => {
    if (sharingProfile) return
    setSharingProfile(true)
    setProfileShareError(false)
    const data = buildProfileShareData({
      username,
      level: currentLevel,
      levelTitle: levelDef.title,
      streak,
      totalActivities: stats.totalActivities,
      medalsCount: claimedKeys.size,
    })
    const outcome = await shareCardImage(data, 'pisozone-profilo.png')
    setSharingProfile(false)
    if (outcome === 'failed') setProfileShareError(true)
    else if (outcome !== 'cancelled') haptic('success')
  }

  if (loading || actsLoading) {
    return (
      <div className="page-enter p-4 space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    )
  }

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{profileText.pageTitle}</span>
        <div className="header-accent" />
      </div>

      {/* Username badge con livello */}
      <div className="card flex items-center gap-3 py-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-[white] flex-shrink-0"
          style={{ background: levelDef.color }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{profileText.account.usernameLabel}</p>
          <p className="font-semibold text-white">@{username}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className="font-bebas text-lg leading-none"
            style={{ color: levelDef.color }}
          >
            {profileText.account.levelPrefix}{currentLevel} {levelDef.emoji}
          </span>
          <span className="text-xs" style={{ color: levelDef.color }}>{levelDef.title}</span>
        </div>
      </div>

      {/* Avatar con cornice */}
      <div className="card flex flex-col items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-full cursor-pointer"
          style={{ border: '2px solid var(--red)' }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[var(--grey)]">
            {photoUrl ? (
              <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User size={36} className="text-gray-500" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <Camera size={22} className="text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label={profileText.account.avatarUploadAriaLabel} onChange={handlePhotoChange} />
        {uploading && <p className="text-xs text-gray-400">{common.loading}</p>}
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        {!uploading && !uploadError && (
          <p className="text-xs text-gray-500">{profileText.account.changePhotoHint}</p>
        )}
      </div>

      {/* In numeri: il proprio profilo come lo vedono gli altri */}
      {pubStats && pubStats.total_activities > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.publicStats.title}</h2>
            <button
              type="button"
              onClick={handleShareProfile}
              disabled={sharingProfile}
              aria-label={shareText.profileButton}
              className="p-1.5 -mr-1.5 text-gray-500 hover:text-white disabled:opacity-40 tap flex-shrink-0"
            >
              <Share2 size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">{profileText.publicStats.hint}</p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-3">
            {[
              [String(pubStats.total_activities), profileText.publicStats.activities],
              [`${Math.round(pubStats.total_minutes / 60)}h`, profileText.publicStats.hours],
              [(Math.round(pubStats.total_km * 10) / 10).toLocaleString('it-IT'), profileText.publicStats.km],
              [String(pubStats.active_days), profileText.publicStats.activeDays],
              [String(pubStats.medals), profileText.publicStats.medals],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-bebas text-2xl text-white leading-none">{value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {profileShareError && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--red)' }}>{shareText.error}</p>
          )}
        </div>
      )}

      {/* Streak attuale (pilastro 02): stesso calcStreak di Home/Calendario/Sfide */}
      <div className="card space-y-2">
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.streak.title}</h2>
        <div className="flex items-center gap-3">
          <Flame
            size={32}
            style={{
              color: streakZone.cssVar,
              filter: streak > 0 ? `drop-shadow(0 0 5px ${streakZone.cssVar})` : 'none',
            }}
          />
          <div>
            <p className="font-bebas text-3xl text-white leading-none">{streak}</p>
            <p className="text-xs text-gray-400 mt-1">
              {streak > 0 ? profileText.streak.daysLabel(streak) : profileText.streak.zeroHint}
            </p>
          </div>
        </div>
      </div>

      {/* Bacheca medaglie vera (pilastro 02): le medaglie sbloccate, non solo il conteggio */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.trophyCase.title}</h2>
          <span className="text-xs text-gray-500">{claimedMedals.length}/{MEDALS.length}</span>
        </div>
        {claimedMedals.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">{profileText.trophyCase.emptyHint}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {claimedMedals.map((m) => (
              <div key={m.key} className="flex flex-col items-center gap-1 w-16">
                <MedalIcon medalKey={m.key} size={44} />
                <span className="text-[10px] text-gray-400 text-center leading-tight">{m.name}</span>
              </div>
            ))}
          </div>
        )}
        <Link
          to="/medals"
          className="w-full flex items-center justify-center gap-1 text-xs py-2 rounded-lg font-medium tap"
          style={{ background: 'var(--grey)', color: 'var(--color-text)' }}
        >
          {profileText.trophyCase.seeAllButton} <ChevronRight size={14} />
        </Link>
      </div>

      {/* I tuoi numeri per sport (pilastro 02): riusa activityTypeCounts */}
      {sportCounts.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.sportBreakdown.title}</h2>
          <div className="space-y-2.5">
            {sportCounts.map(([type, count]) => {
              const opt = ACTIVITY_OPTIONS.find((o) => o.value === type)
              if (!opt) return null
              const pct = (count / maxSportCount) * 100
              return (
                <div key={type} className="flex items-center gap-2.5">
                  <ActivityIcon type={opt.value} size={18} className="text-[var(--red)] flex-shrink-0" />
                  <span className="text-xs text-gray-300 w-20 flex-shrink-0 truncate">{opt.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--grey)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--red)' }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-6 text-right flex-shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sport preferiti: sola lettura, si modificano dalle Impostazioni */}
      {sportPreferiti.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.account.sportTitle}</h2>
            <Link to="/settings" className="text-[11px] text-gray-500 underline">{profileText.account.editInSettings}</Link>
          </div>
          <div className="flex gap-4">
            {sportPreferiti.map((s) => {
              const opt = ACTIVITY_OPTIONS.find((o) => o.value === s)
              if (!opt) return null
              return (
                <div key={s} className="flex flex-col items-center gap-1">
                  <ActivityIcon type={opt.value} className="text-[var(--red)]" />
                  <span className="text-[10px] text-gray-400">{opt.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Heatmap personale (pilastro 02): stesso entry point condizionale di
          Statistiche, resta rigorosamente privata — mai nel profilo di un amico. */}
      {hasGpsRoutes && (
        <div className="card">
          <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{heatmapText.entryCard.heading}</h2>
          <p className="text-xs text-gray-400 mt-1">{heatmapText.entryCard.subtitle}</p>
          <button
            type="button"
            className="btn-primary w-full py-2 text-sm mt-3"
            onClick={() => navigate('/heatmap')}
          >
            {heatmapText.entryCard.button}
          </button>
        </div>
      )}

      {/* ── LIVELLO ──────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-xl tracking-wider" style={{ color: 'var(--red)' }}>{profileText.level.title}</h2>
          <span className="text-sm font-medium text-gray-400">{profileText.level.creditsLabel(credits)}</span>
        </div>

        {/* Level progress row */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {LEVEL_DEFINITIONS.map((ld) => {
            const unlocked = currentLevel >= ld.level
            const isCurrent = currentLevel === ld.level
            return (
              <div
                key={ld.level}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200"
                  style={{
                    background: unlocked ? ld.color + '22' : 'var(--grey)',
                    border: `2px solid ${unlocked ? ld.color : 'var(--grey-light)'}`,
                    outline: isCurrent ? `2px solid ${ld.color}` : undefined,
                    outlineOffset: '2px',
                  }}
                >
                  {unlocked ? (
                    <span style={{ fontSize: '1.1rem' }}>{ld.emoji}</span>
                  ) : (
                    <Lock size={14} className="text-gray-600" />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: unlocked ? ld.color : '#6b7280' }}
                >
                  {ld.level}
                </span>
              </div>
            )
          })}
        </div>

        {/* Current level info */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: levelDef.color + '18', border: `1px solid ${levelDef.color}44` }}
        >
          <span className="text-4xl">{levelDef.emoji}</span>
          <div>
            <p className="font-bebas text-2xl leading-none" style={{ color: levelDef.color }}>
              {levelDef.title}
            </p>
            <p className="text-xs text-gray-400">{profileText.level.levelOfTen(currentLevel)}</p>
          </div>
        </div>

        {/* Next level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {profileText.level.nextPrefix}<span style={{ color: nextLevel.color }}>{nextLevel.emoji} {nextLevel.title}</span>
              </span>
              <span className={`font-medium ${credits >= nextLevel.costToUnlock ? 'text-green-400' : 'text-gray-500'}`}>
                {profileText.creditsAmount(nextLevel.costToUnlock)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--grey)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((credits / nextLevel.costToUnlock) * 100, 100)}%`,
                  background: nextLevel.color,
                }}
              />
            </div>
            <button
              type="button"
              disabled={credits < nextLevel.costToUnlock || shopWorking}
              onClick={handleLevelUp}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={
                credits >= nextLevel.costToUnlock
                  ? { background: nextLevel.color, color: '#000' }
                  : { background: 'var(--grey)', color: '#6b7280', cursor: 'not-allowed' }
              }
            >
              <ChevronRight size={16} />
              {credits >= nextLevel.costToUnlock
                ? profileText.level.upgradeButton(nextLevel.level, nextLevel.costToUnlock)
                : profileText.level.needMoreCredits(nextLevel.costToUnlock - credits)}
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="font-bebas text-xl" style={{ color: levelDef.color }}>{profileText.level.maxLevelTitle}</p>
            <p className="text-xs text-gray-500 mt-1">{profileText.level.maxLevelSubtitle}</p>
          </div>
        )}

        {shopMsg && (
          <p className="text-sm text-center font-medium rounded-lg py-2 px-3" style={{ background: 'var(--grey)', color: 'var(--red)' }}>
            {shopMsg}
          </p>
        )}
      </div>

      {levelUpCelebration && (
        <CelebrationOverlay
          icon={levelUpCelebration.emoji}
          title={profileText.level.celebrationTitle(levelUpCelebration.level)}
          subtitle={profileText.level.celebrationSubtitle(levelUpCelebration.title)}
          onDone={() => setLevelUpCelebration(null)}
        />
      )}
    </div>
  )
}
