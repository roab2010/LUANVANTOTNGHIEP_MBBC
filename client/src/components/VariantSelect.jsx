import { useState, useRef, useEffect } from 'react';

// ============================================
// HÀM LẤY MÃ MÀU HEX THÔNG MINH CHO BIẾN THỂ
// ============================================
export const getVariantColorHex = (colorName = '') => {
  if (!colorName) return '#4B5563';
  const clean = colorName.toLowerCase().trim();

  // Bảng map màu cơ bản và thời trang phổ biến
  const colorMap = {
    'đen': '#111111',
    'black': '#111111',
    'trắng': '#FFFFFF',
    'white': '#FFFFFF',
    'xám': '#6B7280',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'ash fade': '#475569',
    'ash': '#475569',
    'đỏ': '#EF4444',
    'red': '#EF4444',
    'xanh navy': '#1E3A8A',
    'navy': '#1E3A8A',
    'xanh dương': '#2563EB',
    'blue': '#2563EB',
    'light blue': '#7DD3FC',
    'baby blue': '#BAE6FD',
    'xanh da trời': '#38BDF8',
    'xanh nhạt': '#7DD3FC',
    'be': '#D4B996',
    'beige': '#D4B996',
    'kem': '#FEF3C7',
    'cream': '#FEF3C7',
    'xanh lá': '#10B981',
    'green': '#10B981',
    'rêu': '#3F6212',
    'olive': '#3F6212',
    'vàng': '#EAB308',
    'yellow': '#EAB308',
    'hồng': '#EC4899',
    'pink': '#EC4899',
    'cam': '#F97316',
    'orange': '#F97316',
    'tím': '#8B5CF6',
    'purple': '#8B5CF6',
    'violet': '#7C3AED',
    'nâu': '#78350F',
    'brown': '#78350F',
    'than': '#1F2937',
    'charcoal': '#1F2937',
    'bạc': '#E2E8F0',
    'silver': '#E2E8F0',
  };

  if (colorMap[clean]) return colorMap[clean];

  for (const [key, hex] of Object.entries(colorMap)) {
    if (clean.includes(key)) return hex;
  }

  // Hash fallback
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
};

// Chevron Icon
const ChevronDownIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// Check Icon
const CheckIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

/**
 * VariantSelect Component
 * Dropdown chọn biến thể với chấm màu trực quan và badge trạng thái tồn kho (Hết hàng / Số lượng còn)
 */
const VariantSelect = ({
  variants = [],
  selectedIndex = 0,
  onSelect,
  unit = 'cái',
  disabled = false,
  accent = 'teal', // 'teal' | 'amber' | 'black'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedVariant = variants[selectedIndex] || variants[0] || null;

  // Đóng khi click ngoài hoặc bấm phím ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!variants || variants.length === 0) {
    return (
      <div className="h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center text-xs text-gray-400">
        Không có biến thể
      </div>
    );
  }

  // Accent styling
  const focusBorderColor =
    accent === 'amber'
      ? 'border-amber-500 ring-2 ring-amber-500/20'
      : accent === 'black'
      ? 'border-black ring-2 ring-black/20'
      : 'border-teal-500 ring-2 ring-teal-500/20';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[50px] px-3.5 py-2 bg-white border rounded-xl flex items-center justify-between gap-3 text-left transition-all ${
          isOpen ? `${focusBorderColor} shadow-sm` : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      >
        {selectedVariant ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Chấm tròn màu */}
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/15"
              style={{ backgroundColor: getVariantColorHex(selectedVariant.color) }}
            />
            {/* Tên size & màu + Tồn kho */}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 truncate">
                Size {selectedVariant.size} — {selectedVariant.color}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Tồn kho: <span className="font-semibold">{selectedVariant.stock}</span> {unit}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Chọn biến thể...</span>
        )}

        {/* Badge trạng thái tồn kho bên phải */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedVariant && (
            selectedVariant.stock <= 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                Hết hàng
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedVariant.stock} {unit}
              </span>
            )
          )}
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-scale-in">
          {variants.map((v, idx) => {
            const isSelected = idx === selectedIndex;
            const isOutOfStock = v.stock <= 0;
            const colorHex = getVariantColorHex(v.color);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(idx);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-neutral-50/80 font-bold'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Bên trái: Chấm màu + Tên Size Màu + Tồn kho */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/15"
                    style={{ backgroundColor: colorHex }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      Size {v.size} — {v.color}
                    </div>
                    <div className="text-[11px] text-gray-400 font-medium">
                      Tồn kho: <span className="text-gray-600 font-semibold">{v.stock}</span> {unit}
                    </div>
                  </div>
                </div>

                {/* Bên phải: Badge Hết hàng (đỏ) hoặc Số lượng (xanh) + Dấu tích nếu đang chọn */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOutOfStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                      Hết hàng
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {v.stock} {unit}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-gray-900 pl-0.5">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VariantSelect;
