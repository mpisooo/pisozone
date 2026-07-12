// Reazioni sul feed (roadmap v2, pilastro 03 punto 1): il like binario di
// activity_likes (v11) diventa una reazione tipizzata a 5 tipi (colonna
// `kind`, v31). Qui vive SOLO la logica pura (tassonomia + aggregazione),
// testata con Vitest; la persistenza sta in hooks/useFeed, la UI in Social.
//
// Le reazioni sono deliberatamente emoji: il pilastro 01 ha tolto le emoji
// dall'iconografia delle ATTIVITÀ, ma qui — come per livelli e medaglie —
// l'emoji è il linguaggio sociale universale (WhatsApp/Instagram), non un
// segnaposto per un'icona mancante.

export const REACTION_KINDS = ['heart', 'muscle', 'fire', 'clap', 'rocket'] as const
export type ReactionKind = (typeof REACTION_KINDS)[number]

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  heart: '❤️',
  muscle: '💪',
  fire: '🔥',
  clap: '👏',
  rocket: '🚀',
}

// Le righe di activity_likes precedenti alla migrazione v31 non hanno `kind`
// (e in generale un valore sconosciuto non deve rompere il feed): tutto ciò
// che non è riconosciuto vale ❤️, lo stesso default della colonna.
export function normalizeKind(kind: unknown): ReactionKind {
  return REACTION_KINDS.includes(kind as ReactionKind) ? (kind as ReactionKind) : 'heart'
}

export interface ReactionSummary {
  total: number
  byKind: Record<ReactionKind, number>
  mine: ReactionKind | null
}

export function emptyReactionSummary(): ReactionSummary {
  return { total: 0, byKind: { heart: 0, muscle: 0, fire: 0, clap: 0, rocket: 0 }, mine: null }
}

interface ReactionRow {
  activity_id: string
  user_id: string
  kind?: string | null
}

// Aggrega le righe grezze di activity_likes nei riepiloghi per attività
// mostrati nel feed (conteggi per tipo + la reazione dell'utente corrente).
export function buildReactionSummaries(rows: ReactionRow[], myUserId: string): Map<string, ReactionSummary> {
  const map = new Map<string, ReactionSummary>()
  for (const row of rows) {
    const summary = map.get(row.activity_id) ?? emptyReactionSummary()
    const kind = normalizeKind(row.kind)
    summary.total++
    summary.byKind[kind]++
    if (row.user_id === myUserId) summary.mine = kind
    map.set(row.activity_id, summary)
  }
  return map
}

// Applica localmente la MIA reazione a un riepilogo (per l'optimistic update
// del feed): null = rimuovi. Restituisce sempre un oggetto nuovo.
export function withMyReaction(summary: ReactionSummary, kind: ReactionKind | null): ReactionSummary {
  const next: ReactionSummary = {
    total: summary.total,
    byKind: { ...summary.byKind },
    mine: kind,
  }
  if (summary.mine) {
    next.byKind[summary.mine]--
    next.total--
  }
  if (kind) {
    next.byKind[kind]++
    next.total++
  }
  return next
}

// I tipi di reazione presenti, dal più usato al meno usato (a parità di
// conteggio vince l'ordine canonico di REACTION_KINDS) — per il riepilogo
// compatto accanto al bottone, che mostra al massimo `max` emoji.
export function topKinds(summary: ReactionSummary, max = 3): ReactionKind[] {
  return REACTION_KINDS
    .filter((k) => summary.byKind[k] > 0)
    .sort((a, b) => summary.byKind[b] - summary.byKind[a])
    .slice(0, max)
}
