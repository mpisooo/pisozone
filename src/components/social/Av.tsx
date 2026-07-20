interface Props {
  photo: string | null
  name: string
  size?: number
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export default function Av({ photo, name, size = 40 }: Props) {
  const cls = size <= 24 ? 'w-6 h-6 text-[10px]'
            : size <= 32 ? 'w-8 h-8 text-xs'
            : size <= 36 ? 'w-9 h-9 text-sm'
            : 'w-10 h-10 text-base'
  if (photo) return <img src={photo} alt={name} className={`rounded-full object-cover flex-shrink-0 ${cls}`} />
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 font-bebas text-[white] bg-[var(--red)] ${cls}`}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
