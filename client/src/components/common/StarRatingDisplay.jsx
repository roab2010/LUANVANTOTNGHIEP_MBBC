import React from 'react';

const STAR_PATH =
  'M26 4.5l6.4 13.2 14.4 2-10.5 10.1 2.6 14.3L26 37.3l-12.9 6.8 2.6-14.3L5.2 19.7l14.4-2z';

const StarRatingDisplay = ({ rating = 0, size = 'md', showScore = false, className = '' }) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const starSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={`${rating} trên 5 sao`}>
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillRatio = Math.max(0, Math.min(1, rating - (star - 1)));
          return (
            <div key={star} className={`relative ${starSize} shrink-0`}>
              {/* Nền sao xám */}
              <svg viewBox="0 0 52 52" className="w-full h-full text-neutral-200 fill-current">
                <path d={STAR_PATH} />
              </svg>

              {/* Phần sao vàng tô theo tỉ lệ */}
              {fillRatio > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <svg viewBox="0 0 52 52" className="w-full h-full text-amber-400 fill-current">
                    <path d={STAR_PATH} />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showScore && (
        <span className="font-bold text-xs font-mono ml-1 text-neutral-900">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRatingDisplay;
