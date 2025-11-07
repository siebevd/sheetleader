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

interface Result {
  id: number;
  name: string;
  tractor: string;
  horsepower: number | null;
  timestamp: string | null;
  sheetRowId: string | null;
}

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1dVXyQRaRS46FNQrYF8CD0YDWr4BZk1OkS8sQ0_H7BLQ/edit?gid=1892091381#gid=1892091381";
const PASSWORD = "anna";

function Status() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [activeTab, setActiveTab] = useState<"sync" | "database">("sync");

  // Sync tab state
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showOnlyWithChanges, setShowOnlyWithChanges] = useState(false);

  // Database tab state
  const [results, setResults] = useState<Result[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Result>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", tractor: "", horsepower: "" });

  const fetchSyncData = async () => {
    try {
      const [logsRes, statusRes] = await Promise.all([
        fetch("/api/sync/logs"),
        fetch("/api/sync/status"),
      ]);
      const logsData = await logsRes.json();
      const statusData = await statusRes.json();
      setLogs(logsData.logs || []);
      setStatus(statusData);
    } catch (error) {
      console.error("Failed to fetch sync data:", error);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchSyncData();
      fetchResults();
      const syncInterval = setInterval(fetchSyncData, 5000);
      const resultsInterval = setInterval(fetchResults, 10000);
      return () => {
        clearInterval(syncInterval);
        clearInterval(resultsInterval);
      };
    }
  }, [authenticated]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync/trigger", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        setTimeout(fetchSyncData, 1000);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          tractor: addForm.tractor,
          horsepower: addForm.horsepower ? parseInt(addForm.horsepower) : null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAddForm({ name: "", tractor: "", horsepower: "" });
        setShowAddForm(false);
        fetchResults();
      }
    } catch (error) {
      alert("Failed to add result");
    }
  };

  const handleEdit = (result: Result) => {
    setEditingId(result.id);
    setEditForm({ ...result });
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/results/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setEditingId(null);
        setEditForm({});
        fetchResults();
      }
    } catch (error) {
      alert("Failed to update result");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await fetch(`/api/results/${id}`, { method: "DELETE" });
      fetchResults();
    } catch (error) {
      alert("Failed to delete result");
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
    return new Date(timestamp).toLocaleString("nl-NL", {
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

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#005224" }}>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-white text-2xl font-bold mb-4">Status Page - Authentication Required</h1>
          <form onSubmit={handlePasswordSubmit}>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter password" className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60 mb-4" autoFocus />
            <button type="submit" className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#005224" }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">Status & Management</h1>
            <p className="text-white/70">Monitor sync and manage database</p>
          </div>
          <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors">
            Open Google Sheet
          </a>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("sync")} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "sync" ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
            Sync Status
          </button>
          <button onClick={() => setActiveTab("database")} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "database" ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
            Database Management
          </button>
        </div>

        {/* Sync Tab */}
        {activeTab === "sync" && (
          <>
            {status && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-xl font-bold">Current Status</h2>
                  <button onClick={triggerSync} disabled={syncing} className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed">
                    {syncing ? "Syncing..." : "Trigger Sync"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status.status)}`}>{status.status.toUpperCase()}</span>
                  </div>
                  {status.lastSync && (
                    <div>
                      <p className="text-white/70 text-sm mb-1">Last Sync</p>
                      <p className="text-white font-mono">{formatTimestamp(status.lastSync)}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-white/70 text-sm mb-1">Message</p>
                    <p className="text-white">{status.message}</p>
                  </div>
                  {(status.recordsAdded || status.recordsUpdated || status.recordsDeleted) && (
                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                      <div><p className="text-white/70 text-sm mb-1">Added</p><p className="text-green-300 text-2xl font-bold">{status.recordsAdded || 0}</p></div>
                      <div><p className="text-white/70 text-sm mb-1">Updated</p><p className="text-blue-300 text-2xl font-bold">{status.recordsUpdated || 0}</p></div>
                      <div><p className="text-white/70 text-sm mb-1">Deleted</p><p className="text-red-300 text-2xl font-bold">{status.recordsDeleted || 0}</p></div>
                    </div>
                  )}
                  {status.errorDetails && (
                    <div className="md:col-span-2">
                      <p className="text-white/70 text-sm mb-1">Details</p>
                      <p className="text-red-300 font-mono text-sm">{status.errorDetails}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Sync History</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyWithChanges}
                    onChange={(e) => setShowOnlyWithChanges(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/20 text-white focus:ring-white/50"
                  />
                  <span className="text-white/80 text-sm">Only show changes</span>
                </label>
              </div>
              <div className="space-y-3">
                {(() => {
                  const filteredLogs = logs.filter((log) => !showOnlyWithChanges || (log.recordsAdded ?? 0) > 0 || (log.recordsUpdated ?? 0) > 0 || (log.recordsDeleted ?? 0) > 0);

                  if (logs.length === 0) {
                    return <p className="text-white/70 text-center py-8">No sync logs yet</p>;
                  }

                  if (filteredLogs.length === 0) {
                    return <p className="text-white/70 text-center py-8">No logs with changes</p>;
                  }

                  return filteredLogs.map((log) => (
                    <div key={log.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(log.status)}`}>{log.status}</span>
                          <span className="text-white/60 text-sm font-mono">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-white mb-2">{log.message}</p>
                      {((log.recordsAdded ?? 0) > 0 || (log.recordsUpdated ?? 0) > 0 || (log.recordsDeleted ?? 0) > 0) && (
                        <div className="flex gap-4 text-sm">
                          {(log.recordsAdded ?? 0) > 0 && <span className="text-green-300">+{log.recordsAdded} added</span>}
                          {(log.recordsUpdated ?? 0) > 0 && <span className="text-blue-300">~{log.recordsUpdated} updated</span>}
                          {(log.recordsDeleted ?? 0) > 0 && <span className="text-red-300">-{log.recordsDeleted} deleted</span>}
                        </div>
                      )}
                      {log.errorDetails && (
                        <details className="mt-2">
                          <summary className="text-yellow-300 text-sm cursor-pointer">View Details</summary>
                          <pre className="text-white/80 text-xs mt-2 p-2 bg-black/20 rounded overflow-x-auto">{log.errorDetails}</pre>
                        </details>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}

        {/* Database Tab */}
        {activeTab === "database" && (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                {showAddForm ? "Cancel" : "Add Result"}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
                <h2 className="text-white text-xl font-bold mb-4">Add New Result</h2>
                <form onSubmit={handleAdd} className="grid grid-cols-4 gap-4">
                  <input type="text" placeholder="Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" required />
                  <input type="text" placeholder="Tractor" value={addForm.tractor} onChange={(e) => setAddForm({ ...addForm, tractor: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" required />
                  <input type="number" placeholder="HP (optional)" value={addForm.horsepower} onChange={(e) => setAddForm({ ...addForm, horsepower: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" />
                  <button type="submit" className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">Add</button>
                </form>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-white font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Tractor</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">HP</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Sheet Row</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-t border-white/10 hover:bg-white/5">
                        {editingId === result.id ? (
                          <>
                            <td className="px-4 py-3 text-white/70 font-mono">{result.id}</td>
                            <td className="px-4 py-3"><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2 py-1 rounded bg-white/20 text-white border border-white/30 text-sm" /></td>
                            <td className="px-4 py-3"><input type="text" value={editForm.tractor} onChange={(e) => setEditForm({ ...editForm, tractor: e.target.value })} className="w-full px-2 py-1 rounded bg-white/20 text-white border border-white/30 text-sm" /></td>
                            <td className="px-4 py-3"><input type="number" value={editForm.horsepower ?? ""} onChange={(e) => setEditForm({ ...editForm, horsepower: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-2 py-1 rounded bg-white/20 text-white border border-white/30 text-sm" /></td>
                            <td className="px-4 py-3 text-white/70 font-mono text-sm">{result.sheetRowId || "-"}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleUpdate(result.id)} className="px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-sm mr-2">Save</button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="px-3 py-1 bg-gray-600/80 hover:bg-gray-600 text-white rounded text-sm">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-white/70 font-mono">{result.id}</td>
                            <td className="px-4 py-3 text-white">{result.name}</td>
                            <td className="px-4 py-3 text-white">{result.tractor}</td>
                            <td className="px-4 py-3 text-white font-bold">{result.horsepower ?? "-"}</td>
                            <td className="px-4 py-3 text-white/70 font-mono text-sm">{result.sheetRowId || "-"}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleEdit(result)} className="px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-sm mr-2">Edit</button>
                              <button onClick={() => handleDelete(result.id, result.name)} className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-sm">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-white/70 text-sm">
              <p><strong>Total Results:</strong> {results.length}</p>
              <p className="mt-2"><strong>Note:</strong> Results with a Sheet Row ID are synced from Google Sheets. Manual edits will be overwritten by the next sync!</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Status;
