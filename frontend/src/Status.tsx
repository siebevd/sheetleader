import { useEffect, useState } from "react";

interface SyncLog {
  id: number;
  timestamp: string;
  status: string;
  message: string;
  recordsAdded: number | null;
  recordsUpdated: number | null;
  recordsDeleted: number | null;
  errorDetails: string | null;
}

interface SyncStatus {
  status: string;
  lastSync?: string;
  message: string;
  recordsAdded?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  errorDetails?: string;
}

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1dVXyQRaRS46FNQrYF8CD0YDWr4BZk1OkS8sQ0_H7BLQ/edit?gid=1892091381#gid=1892091381";
const PASSWORD = "anna";

function Status() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const fetchData = async () => {
    try {
      // Fetch logs and status in parallel
      const [logsRes, statusRes] = await Promise.all([
        fetch("/api/sync/logs"),
        fetch("/api/sync/status"),
      ]);

      const logsData = await logsRes.json();
      const statusData = await statusRes.json();

      setLogs(logsData.logs || []);
      setStatus(statusData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch sync data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync/trigger", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        // Refresh data after successful sync
        setTimeout(fetchData, 1000);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("nl-NL", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
      setPasswordInput("");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#005224" }}
      >
        <p className="text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#005224" }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-white text-2xl font-bold mb-4">
            Status Page - Authentication Required
          </h1>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60 mb-4"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: "#005224" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">
                Google Sheets Sync Status
              </h1>
              <p className="text-white/70">
                Monitor synchronization between database and Google Sheets
              </p>
            </div>
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span>Open Google Sheet</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Current Status Card */}
        {status && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Current Status</h2>
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {syncing ? "Syncing..." : "Trigger Sync"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                    status.status
                  )}`}
                >
                  {status.status.toUpperCase()}
                </span>
              </div>

              {status.lastSync && (
                <div>
                  <p className="text-white/70 text-sm mb-1">Last Sync</p>
                  <p className="text-white font-mono">
                    {formatTimestamp(status.lastSync)}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <p className="text-white/70 text-sm mb-1">Message</p>
                <p className="text-white">{status.message}</p>
              </div>

              {(status.recordsAdded || status.recordsUpdated || status.recordsDeleted) && (
                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Added</p>
                    <p className="text-green-300 text-2xl font-bold">
                      {status.recordsAdded || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Updated</p>
                    <p className="text-blue-300 text-2xl font-bold">
                      {status.recordsUpdated || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Deleted</p>
                    <p className="text-red-300 text-2xl font-bold">
                      {status.recordsDeleted || 0}
                    </p>
                  </div>
                </div>
              )}

              {status.errorDetails && (
                <div className="md:col-span-2">
                  <p className="text-white/70 text-sm mb-1">Error Details</p>
                  <p className="text-red-300 font-mono text-sm">
                    {status.errorDetails}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync Logs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-white text-xl font-bold mb-4">Sync History</h2>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-white/70 text-center py-8">No sync logs yet</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                      <span className="text-white/60 text-sm font-mono">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-white mb-2">{log.message}</p>

                  {(log.recordsAdded || log.recordsUpdated || log.recordsDeleted) && (
                    <div className="flex gap-4 text-sm">
                      {log.recordsAdded > 0 && (
                        <span className="text-green-300">
                          +{log.recordsAdded} added
                        </span>
                      )}
                      {log.recordsUpdated > 0 && (
                        <span className="text-blue-300">
                          ~{log.recordsUpdated} updated
                        </span>
                      )}
                      {log.recordsDeleted > 0 && (
                        <span className="text-red-300">
                          -{log.recordsDeleted} deleted
                        </span>
                      )}
                    </div>
                  )}

                  {log.errorDetails && (
                    <details className="mt-2">
                      <summary className="text-red-300 text-sm cursor-pointer">
                        Error Details
                      </summary>
                      <pre className="text-red-300/80 text-xs mt-2 p-2 bg-black/20 rounded overflow-x-auto">
                        {log.errorDetails}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Status;
