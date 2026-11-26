/**
 * Chuẩn hóa mã voucher:
 * 1. Không dính dấu tiếng Việt (Telex): Chuyển đổi toàn bộ ký tự có dấu (Đ, Ă, Â, Ê, Ô, Ơ, Ư, Á, À, Ả, Ã, Ạ...)
 *    thành chữ cái Latin không dấu tương ứng (D, A, E, O, U, Y...).
 * 2. Phục hồi phím gõ Telex: Khi gõ bàn phím Telex (Unikey), nếu phím gõ thanh (R, S, F, X, J) vô tình biến
 *    vần phía trước thành dấu hỏi/sắc/huyền/ngã/nặng (ví dụ DANG + R -> DẢNG), hàm sẽ tự động khôi phục đúng chữ cái
 *    được gõ (-> DANGR) thay vì nuốt mất ký tự.
 * 3. Tự động viết hoa, loại bỏ khoảng trắng và các ký tự đặc biệt không hợp lệ (chỉ giữ A-Z, 0-9, '-', '_').
 * 4. Giới hạn độ dài tối đa (mặc định 20 ký tự).
 */
export const normalizePromoCode = (input, prev = '', maxLen = 20) => {
  if (!input) return '';

  const toneMap = {
    // Dấu hỏi (Telex key: R)
    'ả': 'R', 'ẻ': 'R', 'ỉ': 'R', 'ỏ': 'R', 'ủ': 'R', 'ỷ': 'R',
    'Ả': 'R', 'Ẻ': 'R', 'Ỉ': 'R', 'Ỏ': 'R', 'Ủ': 'R', 'Ỷ': 'R',
    // Dấu sắc (Telex key: S)
    'á': 'S', 'é': 'S', 'í': 'S', 'ó': 'S', 'ú': 'S', 'ý': 'S',
    'Á': 'S', 'É': 'S', 'Í': 'S', 'Ó': 'S', 'Ú': 'S', 'Ý': 'S',
    // Dấu huyền (Telex key: F)
    'à': 'F', 'è': 'F', 'ì': 'F', 'ò': 'F', 'ù': 'F', 'ỳ': 'F',
    'À': 'F', 'È': 'F', 'Ì': 'F', 'Ò': 'F', 'Ù': 'F', 'Ỳ': 'F',
    // Dấu ngã (Telex key: X)
    'ã': 'X', 'ẽ': 'X', 'ĩ': 'X', 'õ': 'X', 'ũ': 'X', 'ỹ': 'X',
    'Ã': 'X', 'Ẽ': 'X', 'Ĩ': 'X', 'Õ': 'X', 'Ũ': 'X', 'Ỹ': 'X',
    // Dấu nặng (Telex key: J)
    'ạ': 'J', 'ẹ': 'J', 'ị': 'J', 'ọ': 'J', 'ụ': 'J', 'ỵ': 'J',
    'Ạ': 'J', 'Ẹ': 'J', 'Ị': 'J', 'Ọ': 'J', 'Ụ': 'J', 'Ỵ': 'J',
  };

  const stripVietnamese = (s) => {
    if (!s) return '';
    return s
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
  };

  const cleanCurrent = stripVietnamese(input);
  const cleanPrev = stripVietnamese(prev);

  // Nếu độ dài clean không đổi và prev không rỗng, kiểm tra xem có phải do Unikey ăn phím dấu (r, s, f, x, j) không
  if (cleanCurrent.length === cleanPrev.length && cleanPrev.length > 0 && input.length === prev.length) {
    for (const char of input) {
      if (toneMap[char] && !prev.includes(char)) {
        return (cleanPrev + toneMap[char]).slice(0, maxLen);
      }
    }
  }

  return cleanCurrent.slice(0, maxLen);
};

