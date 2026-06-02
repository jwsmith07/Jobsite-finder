import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-200">
          <h2 className="mb-2 text-lg font-semibold text-red-100">
            Something went wrong rendering this section.
          </h2>
          <p className="mb-3 font-mono text-xs text-red-300/80">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
