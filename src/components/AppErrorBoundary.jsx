import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><h1 className="text-xl font-semibold">MeetWise needs to reload</h1><p className="mt-3 text-slate-600">An unexpected screen error occurred. Your booking data has not been changed.</p><button className="button-primary mt-6" onClick={() => window.location.reload()}>Reload MeetWise</button></section></main>
    }
    return this.props.children
  }
}
