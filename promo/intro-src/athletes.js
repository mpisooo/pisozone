// Atleti in stile pittogramma olimpico, sul linguaggio del set icone dell'app
// (src/lib/activityIconPaths.tsx): griglia 48×48, testa piena r=4, busto
// strokeWidth 6.5, arti 4.5 con round cap. corsa/bici/nuoto/danza sono
// trascrizioni fedeli delle icone; i giocatori di calcio e basket sono
// composizioni nuove nello stesso linguaggio (l'app per quei due sport ha
// solo il pallone). Ogni atleta è una funzione (phase 0..1 del passo) che
// restituisce markup SVG interno; groundY = riga della griglia dove i piedi
// (o le ruote/l'acqua) toccano la linea rossa.

// Attributi condivisi, identici ad ActivityIcon.tsx
const WRAP = (inner) =>
  `<g fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`

const corsa = () => WRAP(`
  <circle cx="30.5" cy="7.5" r="4" fill="currentColor" stroke="none"/>
  <path d="M28.6 12.4 L24.5 25" stroke-width="6.5"/>
  <path d="M39.5 12.5 L34 18 L28.7 13.2 L22.5 18.6 L16.5 15.8"/>
  <path d="M24.5 25 L32.5 30.8 L31 39 L36.5 40.8"/>
  <path d="M24.5 25 L17.5 31 L10.5 27.5"/>
`)

const bici = () => WRAP(`
  <circle cx="10.5" cy="35.5" r="7" stroke-width="4"/>
  <circle cx="37.5" cy="35.5" r="7" stroke-width="4"/>
  <path d="M10.5 35.5 L19.5 23.5 L24 35 L33.5 21" stroke-width="3.5"/>
  <path d="M37.5 35.5 L33.5 20.5" stroke-width="3.5"/>
  <circle cx="32.5" cy="8.5" r="4" fill="currentColor" stroke="none"/>
  <path d="M20 22.5 L29.5 13" stroke-width="6.5"/>
  <path d="M29 14 L34.5 20.5"/>
  <path d="M20 22.5 L27.5 28.5 L24.5 34.5"/>
`)

const nuoto = () => WRAP(`
  <circle cx="28.5" cy="15" r="4.5" fill="currentColor" stroke="none"/>
  <path d="M12 19 L20.5 6.5 L33 9 L38.5 15"/>
  <path d="M4.5 27.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0" stroke-width="4"/>
  <path d="M11.5 36.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0 c3.2 -4.4 6.3 -4.4 9.5 0" stroke-width="4"/>
`)

const danza = () => WRAP(`
  <circle cx="23" cy="6.5" r="4" fill="currentColor" stroke="none"/>
  <path d="M23.4 10.8 L24 18.5" stroke-width="6.5"/>
  <path d="M24 13.5 L31 9 L37.5 3.5"/>
  <path d="M24 13.5 L16.8 15.8 L9.8 19.5"/>
  <path d="M24 17.5 C21 25 16.5 31.5 12.5 37 L35.5 37 C31.5 31.5 27 25 24 17.5 Z" fill="currentColor" stroke="none"/>
  <path d="M18.8 37 L17.8 43.5"/>
  <path d="M29.2 37 L30.2 43.5"/>
`)

// Giocatore di calcio in corsa sul pallone: gamba destra tesa verso il
// pallone davanti al piede, braccia in bilanciamento opposto.
const calcio = (phase = 0) => {
  // Il pallone rotola davanti al piede, con un piccolo anticipo oscillante
  const bx = 40 + Math.sin(phase * Math.PI * 2) * 1.5
  return WRAP(`
    <circle cx="22" cy="7" r="4" fill="currentColor" stroke="none"/>
    <path d="M21.8 11.6 L24.8 24" stroke-width="6.5"/>
    <path d="M23 14.5 L30 12 L35.5 7.5"/>
    <path d="M23 14.5 L15.5 17.5 L9.5 15"/>
    <path d="M24.8 24 L32 31.5 L38.5 37.5"/>
    <path d="M24.8 24 L19 32 L17.5 41.5"/>
    <circle cx="${bx}" cy="41.5" r="4" fill="currentColor" stroke="none"/>
  `)
}

// Giocatore di basket in palleggio: un braccio scende verso il pallone che
// rimbalza tra la mano e la linea, l'altro protegge davanti.
const basket = (phase = 0) => {
  // Rimbalzo: |sin| tra la mano (y≈30) e terra (y≈40)
  const by = 40 - Math.abs(Math.sin(phase * Math.PI * 2)) * 9
  return WRAP(`
    <circle cx="25" cy="6.5" r="4" fill="currentColor" stroke="none"/>
    <path d="M24.6 11 L23.5 23.5" stroke-width="6.5"/>
    <path d="M24 13.5 L31 18 L33.5 25.5"/>
    <path d="M24 13.5 L16.5 16.5 L12 13"/>
    <path d="M23.5 23.5 L29.5 31 L27.5 40.5"/>
    <path d="M23.5 23.5 L17 30 L12.5 38"/>
    <circle cx="34.5" cy="${by}" r="4" fill="currentColor" stroke="none"/>
  `)
}

// groundY: coordinata (griglia 48) che deve poggiare sulla linea.
// bob: ampiezza dell'oscillazione verticale in unità griglia (0 = niente).
module.exports = [
  { key: 'corsa',  draw: corsa,  groundY: 41.5, bob: 1.6 },
  { key: 'bici',   draw: bici,   groundY: 42.5, bob: 0 },
  { key: 'calcio', draw: calcio, groundY: 45.5, bob: 1.2 },
  { key: 'basket', draw: basket, groundY: 44,   bob: 1.2 },
  { key: 'nuoto',  draw: nuoto,  groundY: 39,   bob: 0.8 },
  { key: 'danza',  draw: danza,  groundY: 43.5, bob: 1.6 },
]
