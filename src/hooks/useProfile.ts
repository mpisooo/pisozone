// Il profilo è ora stato condiviso via Context (vedi ProfileContext) così TopBar, pagine e
// modali vedono sempre gli stessi dati aggiornati. Questo file resta come re-export per non
// dover cambiare tutti gli import esistenti.
export { useProfile } from '../context/ProfileContext'
