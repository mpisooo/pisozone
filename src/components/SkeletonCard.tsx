// Riga di lista con avatar (classifica, amici, conversazioni)
export function SkeletonRow({ avatarSize = 40, lines = 1 }: { avatarSize?: number; lines?: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <div className="skeleton rounded-full flex-shrink-0" style={{ width: avatarSize, height: avatarSize }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 rounded w-1/3" />
        {lines === 2 && <div className="skeleton h-2.5 rounded w-2/3" />}
      </div>
    </div>
  )
}

export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}
