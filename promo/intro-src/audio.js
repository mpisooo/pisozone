// Colonna audio sintetizzata in puro Node (WAV 44.1kHz stereo 16-bit):
// battito che accompagna la sfilata, riser verso il finale, impatto sul
// reveal del wordmark e accordo sostenuto (LA maggiore) sotto il logo.
const fs = require('fs')

const SR = 44100
const DUR = 13.0
const N = Math.round(SR * DUR)
const L = new Float64Array(N)
const R = new Float64Array(N)

const BPM = 126
const BEAT = 60 / BPM

const IMPACT_T = 8.9 // il momento in cui appare PISOZONE (T_WORDMARK in video.js)

function addMono(t0, durS, fn, gain = 1, pan = 0) {
  const start = Math.max(0, Math.round(t0 * SR))
  const len = Math.min(N - start, Math.round(durS * SR))
  const gl = gain * Math.min(1, 1 - pan)
  const gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const v = fn(t)
    L[start + i] += v * gl
    R[start + i] += v * gr
  }
}

// ── Kick: seno con pitch che precipita, code corta ──
function kick(t0, gain = 0.9) {
  addMono(t0, 0.28, (t) => {
    const f = 42 + 120 * Math.exp(-t * 26)
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 11)
  }, gain)
}

// ── Hi-hat: rumore filtrato alla buona (differenza = passa-alto) ──
function hat(t0, gain = 0.16) {
  let prev = 0
  addMono(t0, 0.05, (t) => {
    const n = Math.random() * 2 - 1
    const hp = n - prev
    prev = n
    return hp * Math.exp(-t * 90)
  }, gain, 0.15)
}

// ── Basso: impulsi corti su LA1 ──
function bassPulse(t0, gain = 0.2) {
  addMono(t0, 0.22, (t) => {
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 9)
    return Math.sin(2 * Math.PI * 55 * t) * env
  }, gain)
}

// ── Nota di pad con lieve detune e attacco morbido ──
function padNote(t0, durS, freq, gain, pan) {
  addMono(t0, durS, (t) => {
    const atk = Math.min(1, t / 0.5)
    const rel = Math.min(1, Math.max(0, (durS - t) / 1.6))
    const v = Math.sin(2 * Math.PI * freq * t) * 0.6
      + Math.sin(2 * Math.PI * (freq * 1.003) * t) * 0.4
      + Math.sin(2 * Math.PI * (freq * 2) * t) * 0.12
    return v * atk * rel
  }, gain, pan)
}

// Battito: parte con la sfilata, si ferma sull'impatto
for (let t = 0.95; t < IMPACT_T - 0.05; t += BEAT) {
  kick(t)
  hat(t + BEAT / 2)
}
// Basso in ottavi da quando la sfilata è piena
for (let t = 0.95 + BEAT * 4; t < IMPACT_T - 0.05; t += BEAT / 2) bassPulse(t)

// Riser: rumore + seno che sale, dentro l'ultimo tratto della sfilata
addMono(6.9, IMPACT_T - 6.9, (t) => {
  const p = t / (IMPACT_T - 6.9)
  const noise = (Math.random() * 2 - 1) * 0.5 * p * p
  const sweep = Math.sin(2 * Math.PI * (180 + 620 * p * p) * t) * 0.35 * p
  return noise + sweep
}, 0.4)

// Impatto: boom grave + sbuffo di rumore
addMono(IMPACT_T, 1.6, (t) => {
  const f = 30 + 55 * Math.exp(-t * 10)
  return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3.2)
}, 1.0)
addMono(IMPACT_T, 0.16, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 40), 0.4)

// Accordo di LA maggiore sotto il logo (A2, C#3, E3, A3), pan leggero
padNote(IMPACT_T + 0.05, 3.9, 110.0, 0.14, -0.25)
padNote(IMPACT_T + 0.10, 3.85, 138.59, 0.11, 0.25)
padNote(IMPACT_T + 0.15, 3.8, 164.81, 0.11, -0.1)
padNote(IMPACT_T + 0.20, 3.75, 220.0, 0.09, 0.1)

// Colpo finale morbido sul comparire della tagline
kick(9.85, 0.5)

// Fade-out del master e normalizzazione
const FADE_FROM = 12.2
for (let i = 0; i < N; i++) {
  const t = i / SR
  if (t > FADE_FROM) {
    const g = Math.max(0, 1 - (t - FADE_FROM) / (DUR - FADE_FROM))
    L[i] *= g * g
    R[i] *= g * g
  }
}
let peak = 0
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
const norm = peak > 0 ? 0.89 / peak : 1

// Scrittura WAV 16-bit stereo
const data = Buffer.alloc(N * 4)
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), i * 4)
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), i * 4 + 2)
}
const header = Buffer.alloc(44)
header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8)
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28)
header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34)
header.write('data', 36); header.writeUInt32LE(data.length, 40)
fs.writeFileSync('audio.wav', Buffer.concat([header, data]))
console.log(`audio.wav ok (${DUR}s, peak ${peak.toFixed(2)} → norm)`)
