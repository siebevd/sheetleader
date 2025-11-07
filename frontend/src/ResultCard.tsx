interface Result {
  id: number;
  name: string;
  tractor: string;
  horsepower: number | null;
  timestamp: string;
  comparisons?: Result[];
}

interface ResultCardProps {
  result: Result;
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
      <div className="text-center">
        <h2 className="text-6xl font-bold text-white mb-4">{result.name}</h2>
        <p className="text-4xl text-white/90 mb-6">{result.tractor}</p>
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl px-12 py-8 mb-6">
          <p className="text-8xl font-black text-white">
            {result.horsepower ?? "—"}
            <span className="text-5xl ml-2">PK</span>
          </p>
        </div>

        {/* Comparisons */}
        {result.comparisons && result.comparisons.length > 1 && (
          <div className="mt-6 bg-white/5 rounded-xl p-5">
            <p className="text-white/60 text-lg uppercase tracking-wide mb-4">
              Top {result.tractor}
            </p>
            <div className="space-y-2">
              {result.comparisons.slice(0, 5).map((comp, idx) => (
                <div
                  key={comp.id}
                  className={`flex justify-between items-center text-base ${
                    comp.id === result.id
                      ? "text-yellow-300 font-bold"
                      : "text-white/70"
                  }`}
                >
                  <span className="truncate flex-1 text-left text-xl">
                    {idx + 1}. {comp.name}
                  </span>
                  <span className="font-bold ml-2 text-xl">
                    {comp.horsepower} PK
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
