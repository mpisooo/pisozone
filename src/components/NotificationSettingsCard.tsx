import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2, Dumbbell, MessageCircle, UserPlus, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { pushSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import profileText from '../lib/i18n/profile'
import type { Profile } from '../types'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DEFAULT_QUIET_START = 23
const DEFAULT_QUIET_END = 7

type NotifBoolField = 'notif_reminder_enabled' | 'notif_messages_enabled' | 'notif_friend_requests_enabled'

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

function CategoryToggle({
  icon, label, enabled, saving, onToggle,
}: {
  icon: React.ReactNode
  label: string
  enabled: boolean
  saving: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        {icon}
        <span>{label}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled ? 'true' : 'false'}
        aria-label={label}
        onClick={onToggle}
        disabled={saving}
        className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
          enabled ? 'bg-[var(--red)]' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

export default function NotificationSettingsCard() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState(false)
  const [prefError, setPrefError] = useState('')
  const [savingField, setSavingField] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const ok = pushSupported()
      if (!cancelled) setSupported(ok)
      if (ok) {
        const sub = await isSubscribed()
        if (!cancelled) setSubscribed(sub)
      }
      if (!cancelled) setChecked(true)
    }
    check()
    return () => { cancelled = true }
  }, [])

  const handleToggle = async () => {
    if (!user || working) return
    setWorking(true)
    setError('')
    if (subscribed) {
      const { error: err } = await unsubscribeFromPush()
      setWorking(false)
      if (err) { setError(err); return }
      setSubscribed(false)
    } else {
      const { error: err } = await subscribeToPush(user.id)
      setWorking(false)
      if (err) { setError(err); return }
      setSubscribed(true)
    }
  }

  const savePref = async (field: string, updates: Partial<Profile>) => {
    setPrefError('')
    setSavingField(field)
    const { error: err } = await updateProfile(updates)
    setSavingField(null)
    if (err) setPrefError(profileText.notifications.prefSaveFailed)
  }

  const toggleCategory = (field: NotifBoolField, current: boolean) => {
    savePref(field, { [field]: !current })
  }

  const quietStart = profile?.notif_quiet_start ?? null
  const quietEnd = profile?.notif_quiet_end ?? null
  const quietActive = quietStart != null && quietEnd != null

  const toggleQuietHours = () => {
    if (quietActive) {
      savePref('quiet', { notif_quiet_start: null, notif_quiet_end: null })
    } else {
      savePref('quiet', { notif_quiet_start: DEFAULT_QUIET_START, notif_quiet_end: DEFAULT_QUIET_END })
    }
  }

  if (!checked) return null

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-[var(--red)]" />
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.notifications.title}</h2>
      </div>

      {!supported ? (
        <p className="text-xs text-gray-500 leading-relaxed">
          {profileText.notifications.unsupported}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              {subscribed
                ? <BellRing size={16} className="text-green-400 flex-shrink-0" />
                : <BellOff size={16} className="text-gray-500 flex-shrink-0" />}
              <span className={subscribed ? 'text-green-400' : 'text-gray-400'}>
                {subscribed ? profileText.notifications.active : profileText.notifications.inactive}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={working}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                subscribed ? 'text-gray-400 border border-gray-600' : 'btn-primary'
              }`}
            >
              {working ? <Loader2 size={14} className="animate-spin" /> : subscribed ? profileText.notifications.disable : profileText.notifications.enable}
            </button>
          </div>

          {subscribed && (
            <div className="pt-3 border-t border-gray-700 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{profileText.notifications.categoriesTitle}</p>
              <CategoryToggle
                icon={<Dumbbell size={16} className="text-gray-400 flex-shrink-0" />}
                label={profileText.notifications.categoryWorkoutReminder}
                enabled={profile?.notif_reminder_enabled ?? true}
                saving={savingField === 'notif_reminder_enabled'}
                onToggle={() => toggleCategory('notif_reminder_enabled', profile?.notif_reminder_enabled ?? true)}
              />
              <CategoryToggle
                icon={<MessageCircle size={16} className="text-gray-400 flex-shrink-0" />}
                label={profileText.notifications.categoryNewMessages}
                enabled={profile?.notif_messages_enabled ?? true}
                saving={savingField === 'notif_messages_enabled'}
                onToggle={() => toggleCategory('notif_messages_enabled', profile?.notif_messages_enabled ?? true)}
              />
              <CategoryToggle
                icon={<UserPlus size={16} className="text-gray-400 flex-shrink-0" />}
                label={profileText.notifications.categoryFriendRequests}
                enabled={profile?.notif_friend_requests_enabled ?? true}
                saving={savingField === 'notif_friend_requests_enabled'}
                onToggle={() => toggleCategory('notif_friend_requests_enabled', profile?.notif_friend_requests_enabled ?? true)}
              />

              <div className="pt-3 border-t border-gray-700 space-y-3">
                <CategoryToggle
                  icon={<Moon size={16} className="text-gray-400 flex-shrink-0" />}
                  label={profileText.notifications.categoryQuietHours}
                  enabled={quietActive}
                  saving={savingField === 'quiet'}
                  onToggle={toggleQuietHours}
                />
                {quietActive && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="quiet-start">{profileText.notifications.quietFromLabel}</label>
                      <select
                        id="quiet-start"
                        aria-label={profileText.notifications.quietStartAriaLabel}
                        className="input-dark"
                        value={quietStart ?? DEFAULT_QUIET_START}
                        disabled={savingField === 'notif_quiet_start'}
                        onChange={(e) => savePref('notif_quiet_start', { notif_quiet_start: Number(e.target.value) })}
                      >
                        {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="quiet-end">{profileText.notifications.quietToLabel}</label>
                      <select
                        id="quiet-end"
                        aria-label={profileText.notifications.quietEndAriaLabel}
                        className="input-dark"
                        value={quietEnd ?? DEFAULT_QUIET_END}
                        disabled={savingField === 'notif_quiet_end'}
                        onChange={(e) => savePref('notif_quiet_end', { notif_quiet_end: Number(e.target.value) })}
                      >
                        {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {profileText.notifications.quietHint}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed">
            {profileText.notifications.iosHint}
          </p>
        </>
      )}

      {(error || prefError) && <p className="text-xs text-red-400">{error || prefError}</p>}
    </div>
  )
}
