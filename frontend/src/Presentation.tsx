import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ResultCard from "./ResultCard";

interface ImagesResponse {
  images: string[];
  error?: string;
}

interface Result {
  id: number;
  name: string;
  tractor: string;
  horsepower: number | null;
  timestamp: string;
  comparisons?: Result[];
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

function Presentation() {
  const [images, setImages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [resultIndex, setResultIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageFade, setImageFade] = useState(true);
  const [resultFade, setResultFade] = useState(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  // Fetch images
  useEffect(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data: ImagesResponse) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch((err) => console.error("Failed to fetch images:", err));
  }, []);

  // Fetch stats
  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data: StatsResponse) => setStats(data))
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

  // Fetch results (last 20 completed) and poll every minute
  useEffect(() => {
    const fetchResults = () => {
      fetch("/api/results/recent")
        .then((res) => res.json())
        .then((data: ResultsResponse) => {
          if (data.results && data.results.length > 0) {
            setResults(data.results);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch results:", err);
          setLoading(false);
        });
    };

    // Initial fetch
    fetchResults();

    // Poll every minute (60000ms)
    const interval = setInterval(fetchResults, 60000);

    return () => clearInterval(interval);
  }, []);

  // Rotate images every 30 seconds
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setImageFade(false);
      setTimeout(() => {
        setImageIndex((prev) => (prev + 1) % images.length);
        setImageFade(true);
      }, 500);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Rotate results every 15 seconds (show 2 at a time)
  useEffect(() => {
    if (results.length === 0) return;

    const interval = setInterval(() => {
      setResultFade(false);
      setTimeout(() => {
        setResultIndex((prev) => {
          // Move by 2 each time, wrap around if needed
          const next = prev + 2;
          return next >= results.length ? 0 : next;
        });
        setResultFade(true);
      }, 500);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [results.length]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#005224" }}
      >
        <p className="text-white text-2xl">Loading slideshow...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#005224" }}
      >
        <p className="text-white text-2xl">
          No images found. Add images to app/images/
        </p>
      </div>
    );
  }

  const currentResult = results[resultIndex];
  const nextResult = results[resultIndex + 1];

  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: "#005224" }}
    >
      {/* Background image - full screen */}
      <img
        src="/scherm.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Logo overlay - left 30% width with fade effect */}
      <div
        className="absolute left-0 top-0 h-full flex items-center"
        style={{ width: "30%" }}
      >
        {images.length > 0 && (
          <img
            src={`/api/images/${images[imageIndex]}`}
            alt={`Logo ${imageIndex + 1}`}
            className={`w-full h-auto object-contain p-8 transition-opacity duration-500 ${
              imageFade ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Results display - right 70% width - 2 results side by side */}
      <div
        className="absolute right-0 top-0 h-full flex items-center justify-center p-8 pb-32"
        style={{ width: "70%" }}
      >
        {results.length > 0 && (
          <div
            className={`grid grid-cols-2 gap-6 w-full max-w-6xl transition-opacity duration-500 ${
              resultFade ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* First Result */}
            {currentResult && <ResultCard result={currentResult} />}

            {/* Second Result */}
            {nextResult ? (
              <ResultCard result={nextResult} />
            ) : (
              <div className="bg-white/5 rounded-3xl p-8 border-2 border-white/10 shadow-2xl flex items-center justify-center">
                <p className="text-white/40 text-2xl">
                  Meer resultaten komen eraan...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats and QR Code at Bottom Right */}
      <div className="absolute bottom-8 right-8 flex items-end gap-8">
        {/* Stats */}
        {stats && (
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-white/70 text-base uppercase tracking-wide mb-2">
                Totaal Metingen
              </p>
              <p className="text-5xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-base uppercase tracking-wide mb-2">
                Gemiddeld PK
              </p>
              <p className="text-5xl font-bold text-white">
                {stats.averageHorsepower}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-base uppercase tracking-wide mb-2">
                Hoogste PK
              </p>
              <p className="text-5xl font-bold text-yellow-300">
                {stats.maxHorsepower}
              </p>
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-3">
            <QRCodeSVG
              value="https://volvermogentegenkanker.byundefined.com"
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-center font-bold text-lg text-gray-800 uppercase tracking-wide">
            Zie Resultaten
          </p>
        </div>
      </div>
    </div>
  );
}

export default Presentation;
