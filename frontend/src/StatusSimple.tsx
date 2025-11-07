import { useEffect, useState } from "react";

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
  const [results, setResults] = useState<Result[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Result>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", tractor: "", horsepower: "" });

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
      fetchResults();
      const interval = setInterval(fetchResults, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
      setPasswordInput("");
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
    setEditForm({ ...result, horsepower: result.horsepower ?? undefined });
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

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#005224" }}>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-white text-2xl font-bold mb-4">Database Management</h1>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60 mb-4"
              autoFocus
            />
            <button type="submit" className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors">
              Enter
            </button>
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
            <h1 className="text-white text-3xl font-bold mb-2">Database Management</h1>
            <p className="text-white/70">Emergency CRUD operations</p>
          </div>
          <div className="flex gap-2">
            <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors">
              Open Google Sheet
            </a>
            <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
              {showAddForm ? "Cancel" : "Add Result"}
            </button>
          </div>
        </header>

        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
            <h2 className="text-white text-xl font-bold mb-4">Add New Result</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-4 gap-4">
              <input type="text" placeholder="Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" required />
              <input type="text" placeholder="Tractor" value={addForm.tractor} onChange={(e) => setAddForm({ ...addForm, tractor: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" required />
              <input type="number" placeholder="Horsepower (optional)" value={addForm.horsepower} onChange={(e) => setAddForm({ ...addForm, horsepower: e.target.value })} className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/60" />
              <button type="submit" className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                Add
              </button>
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
      </div>
    </div>
  );
}

export default Status;
