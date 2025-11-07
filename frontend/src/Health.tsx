import { useEffect, useState } from 'react'

interface ApiResponse {
  message: string
}

interface HealthResponse {
  status: string
  timestamp: string
}

function Health() {
  const [message, setMessage] = useState<string>('Loading...')
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    fetch('/api/hello?name=SheetLeader')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((err) => {
        console.error('API error:', err)
        setMessage('Error connecting to backend: ' + err.message)
      })

    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data: HealthResponse) => setHealth(data))
      .catch((err) => console.error('Health check failed:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <header className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 text-center">
            SheetLeader
          </h1>

          <div className="mb-6">
            <p className="text-xl text-cyan-400 font-semibold text-center">
              {message}
            </p>
          </div>

          {health && (
            <div className="mt-8 bg-slate-900/50 rounded-lg p-6 border border-slate-600">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                System Status
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Backend Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    {health.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Last Check:</span>
                  <span className="text-slate-400 text-sm">
                    {new Date(health.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-x-4">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg"
            >
              View Leaderboard
            </a>
            <a
              href="/presentation"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg"
            >
              View Presentation
            </a>
          </div>
        </header>
      </div>
    </div>
  )
}

export default Health
