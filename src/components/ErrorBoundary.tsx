import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6" style={{ minHeight: '60vh' }}>
          <div className="card max-w-sm w-full text-center space-y-3">
            <AlertTriangle size={32} className="mx-auto text-[var(--red)]" />
            <p className="font-bebas text-2xl text-white tracking-widest">QUALCOSA È ANDATO STORTO</p>
            <p className="text-sm text-gray-400">
              Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.
            </p>
            <button type="button" onClick={this.handleReload} className="btn-primary w-full">
              Ricarica pagina
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
