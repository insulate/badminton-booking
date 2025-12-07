export default function HomePage() {
  // Mockup court layout - 8 courts
  const courts = [
    { id: 1, name: 'Court 1' },
    { id: 2, name: 'Court 2' },
    { id: 3, name: 'Court 3' },
    { id: 4, name: 'Court 4' },
    { id: 5, name: 'Court 5' },
    { id: 6, name: 'Court 6' },
    { id: 7, name: 'Court 7' },
    { id: 8, name: 'Court 8' },
  ];

  return (
    <div className="min-h-full p-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          แผนผังสนาม
        </h1>
        <p className="text-blue-200 text-sm">
          Lucky Badminton - 8 Courts
        </p>
      </div>

      {/* Court Layout SVG Diagram */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
        {/* Floor Plan Container */}
        <div className="relative bg-gradient-to-b from-green-800 to-green-700 rounded-xl p-4 overflow-hidden">
          {/* Background pattern - court lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-2 border-2 border-white rounded"></div>
          </div>

          {/* Courts Grid - 2 rows x 4 cols */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
            {courts.map((court) => (
              <div
                key={court.id}
                className="aspect-[2/3] bg-green-600/50 rounded-lg border-2 border-yellow-400/50 p-2 flex flex-col"
              >
                {/* Court Number */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {/* Court lines */}
                    <svg
                      viewBox="0 0 100 150"
                      className="w-full h-full"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Outer boundary */}
                      <rect
                        x="5"
                        y="5"
                        width="90"
                        height="140"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                      />
                      {/* Center line */}
                      <line
                        x1="5"
                        y1="75"
                        x2="95"
                        y2="75"
                        stroke="white"
                        strokeWidth="1"
                      />
                      {/* Service lines - top */}
                      <line
                        x1="5"
                        y1="25"
                        x2="95"
                        y2="25"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      {/* Service lines - bottom */}
                      <line
                        x1="5"
                        y1="125"
                        x2="95"
                        y2="125"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      {/* Center vertical line - top half */}
                      <line
                        x1="50"
                        y1="25"
                        x2="50"
                        y2="75"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      {/* Center vertical line - bottom half */}
                      <line
                        x1="50"
                        y1="75"
                        x2="50"
                        y2="125"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      {/* Net position indicator */}
                      <line
                        x1="5"
                        y1="75"
                        x2="95"
                        y2="75"
                        stroke="yellow"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                {/* Court label */}
                <div className="text-center py-1">
                  <span className="inline-block bg-blue-900/80 text-yellow-400 font-bold text-xs md:text-sm px-2 py-1 rounded">
                    {court.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-yellow-400"></div>
              <span>Net</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-white/50 rounded"></div>
              <span>Court Area</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-yellow-400/20 rounded-lg px-4 py-3">
            <p className="text-yellow-200 text-sm">
              <span className="font-bold text-yellow-400">8</span> Courts Available
            </p>
            <p className="text-xs text-blue-200 mt-1">
              Professional Standard Courts
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Preview */}
      <div className="mt-6 text-center text-sm text-blue-200">
        <p>TEL: 099-999-9999</p>
        <p>LINE: @luckybadminton</p>
      </div>
    </div>
  );
}
