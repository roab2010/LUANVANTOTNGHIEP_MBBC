import { useState } from 'react';
import { cancelImportReceipt } from '../../../services/importReceiptApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PrinterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.656h10.5z" />
  </svg>
);

const CancelIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ImportReceiptDetailModal = ({ receipt, onClose, onRefresh }) => {
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');

  if (!receipt) return null;

  const handleCancelReceipt = async () => {
    try {
      setCancelling(true);
      setError('');
      await cancelImportReceipt(receipt._id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy phiếu nhập này');
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isCompleted = receipt.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden z-10 print:shadow-none print:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 print:bg-white">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">
                  Chi tiết phiếu nhập: {receipt.receiptCode}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    receipt.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {receipt.status === 'completed' ? 'Đã nhập kho' : 'Đã hủy'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Thời gian tạo: {formatDate(receipt.importDate || receipt.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <PrinterIcon />
                In phiếu
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Thông tin nhà cung cấp & Tổng quát */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nhà cung cấp
                </h4>
                <div className="text-sm font-semibold text-gray-900">
                  {receipt.supplier?.name || 'Không xác định'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">SĐT:</span> {receipt.supplier?.phone || 'Chưa có'}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  <span className="font-medium">Địa chỉ:</span> {receipt.supplier?.address || 'Chưa có'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Thông tin đơn nhập
                </h4>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Mã phiếu:</span>{' '}
                  <span className="font-semibold text-gray-900">{receipt.receiptCode}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Số chủng loại sản phẩm:</span> {receipt.items?.length || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Ghi chú:</span> {receipt.note || 'Không có ghi chú'}
                </div>
              </div>
            </div>

            {/* Bảng danh sách sản phẩm nhập */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Danh sách mặt hàng nhập ({receipt.items?.length || 0})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                        ĐVT
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                        Đơn giá nhập
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipt.items?.map((item, index) => {
                      const prod = item.product;
                      return (
                        <tr key={index} className="hover:bg-gray-50 text-sm">
                          <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {prod?.name || 'Sản phẩm đã bị xóa'}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {prod?.unit || 'Cái'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatPrice(item.importPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                            {formatPrice(item.total || item.quantity * item.importPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-800">
                        TỔNG TIỀN PHIẾU NHẬP:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-base text-red-600">
                        {formatPrice(receipt.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Cảnh báo khi chuẩn bị Hủy phiếu */}
            {confirmCancel && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800">
                  Xác nhận hủy phiếu nhập này?
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Khi hủy phiếu nhập, hệ thống sẽ tự động trừ lùi số lượng tương ứng trong kho hàng của từng sản phẩm.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleCancelReceipt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling && <SpinnerIcon />}
                    Đồng ý hủy phiếu
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => setConfirmCancel(false)}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    Không hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 print:hidden">
            <div>
              {isCompleted && !confirmCancel && (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  <CancelIcon />
                  Hủy phiếu nhập
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportReceiptDetailModal;
