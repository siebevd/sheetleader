import { useEffect, useState } from "react";

interface Result {
  id: number;
  name: string;
  tractor: string;
  horsepower: number | null;
  timestamp: string;
}

interface ResultsResponse {
  results: Result[];
}

interface StatsResponse {
  total: number;
  averageHorsepower: number;
  maxHorsepower: number;
  mostPopularModel: {
    tractor: string;
    count: number;
  } | null;
}

interface ImagesResponse {
  images: string[];
  error?: string;
}

function Home() {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"completed" | "upcoming">(
    "completed"
  );

  useEffect(() => {
    // Fetch all results
    fetch("/api/results")
      .then((res) => res.json())
      .then((data: ResultsResponse) => {
        setResults(data.results);
        setFilteredResults(data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch results:", err);
        setLoading(false);
      });

    // Fetch stats
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data: StatsResponse) => setStats(data))
      .catch((err) => console.error("Failed to fetch stats:", err));

    // Fetch sponsor images
    fetch("/api/images")
      .then((res) => res.json())
      .then((data: ImagesResponse) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch((err) => console.error("Failed to fetch images:", err));
  }, []);

  // Rotate sponsor images every 5 seconds
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    let filtered = results;

    // Filter by tab
    if (activeTab === "completed") {
      filtered = filtered.filter((result) => result.horsepower !== null);
    } else {
      filtered = filtered.filter((result) => result.horsepower === null);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (result) =>
          result.name.toLowerCase().includes(query) ||
          result.tractor.toLowerCase().includes(query)
      );
    }

    setFilteredResults(filtered);
  }, [searchQuery, results, activeTab]);

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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#005224" }}
    >
      <div className="flex-1 p-4 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-6">
            <p className="text-white/80 text-xl text-white ">
              Vol vermogen tegen kanker
            </p>
          </header>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">
                  Metingen
                </p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">
                  Gem. PK
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.averageHorsepower}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">
                  Max PK
                </p>
                <p className="text-2xl font-bold text-yellow-300">
                  {stats.maxHorsepower}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">
                  Populair
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {stats.mostPopularModel?.tractor || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === "completed"
                  ? "bg-white/20 text-white border-2 border-white/40"
                  : "bg-white/10 text-white/60 border-2 border-white/20"
              }`}
            >
              Resultaten
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === "upcoming"
                  ? "bg-white/20 text-white border-2 border-white/40"
                  : "bg-white/10 text-white/60 border-2 border-white/20"
              }`}
            >
              Binnenkort
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Zoek op naam of tractor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            />
          </div>

          {/* Results List - Mobile Optimized */}
          <div className="space-y-2">
            {filteredResults.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
                <p className="text-white/70">Geen resultaten gevonden</p>
              </div>
            ) : (
              filteredResults.map((result) => {
                const resultDate = new Date(result.timestamp);

                return (
                  <div
                    key={result.id}
                    className="backdrop-blur-sm rounded-lg p-4 border bg-white/10 border-white/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">
                          {result.name}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {result.tractor}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-300 font-black text-2xl">
                          {result.horsepower ?? "—"}
                        </p>
                        <p className="text-white/60 text-xs">PK</p>
                      </div>
                    </div>
                    <div className="text-white/60 text-sm font-mono font-semibold">
                      {resultDate.toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Fixed Sponsor Banner at Bottom */}
      {images.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-md border-t-2 border-white/30 py-4">
          <div className="flex items-center justify-center h-16">
            <img
              src={`/api/images/${images[imageIndex]}`}
              alt={`Sponsor ${imageIndex + 1}`}
              className="h-full w-auto object-contain transition-opacity duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
