import common from './common'
import shell from './shell'
import auth from './auth'
import home from './home'
import log from './log'
import calendar from './calendar'
import stats from './stats'
import challenges from './challenges'
import medals from './medals'
import profile from './profile'
import social from './social'
import legal from './legal'

// Punto unico di aggregazione dei namespace: oggi esiste solo l'italiano, ma è
// qui che in futuro si sceglierebbe il dizionario giusto in base a una
// preferenza utente/browser, senza dover ritoccare le pagine (che importano
// ogni namespace direttamente dal proprio file, non da qui).
const it = {
  common, shell, auth, home, log, calendar, stats, challenges, medals, profile, social, legal,
} as const

export type Strings = typeof it
export const strings = it
export default it
