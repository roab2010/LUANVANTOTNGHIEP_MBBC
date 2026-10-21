const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (val) => {
  if (val === null || val === undefined) return <span className="text-gray-400 italic">Trống</span>;
  if (typeof val === 'boolean') {
    return val ? (
      <span className="text-emerald-700 font-semibold">Đúng (true)</span>
    ) : (
      <span className="text-red-700 font-semibold">Sai (false)</span>
    );
  }
  if (typeof val === 'number') {
    return <span className="font-mono font-semibold">{val.toLocaleString('vi-VN')}</span>;
  }
  if (typeof val === 'object') {
    return (
      <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-h-40">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }
  return String(val);
};

const getActionBadge = (action) => {
  const map = {
    CREATE: { label: 'Thêm mới', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    UPDATE: { label: 'Cập nhật', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    DELETE: { label: 'Xóa dữ liệu', cls: 'bg-red-50 text-red-700 border-red-200' },
    LOGIN: { label: 'Đăng nhập', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    LOGOUT: { label: 'Đăng xuất', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    STATUS_CHANGE: { label: 'Đổi trạng thái', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    STOCK_IN: { label: 'Nhập kho', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    STOCK_OUT: { label: 'Xuất kho', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const item = map[action] || { label: action, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const getModuleBadge = (mod) => {
  const map = {
    AUTH: 'Xác thực',
    USER: 'Khách hàng / User',
    PRODUCT: 'Sản phẩm',
    CATEGORY: 'Danh mục',
    SUPPLIER: 'Nhà cung cấp',
    ORDER: 'Đơn hàng',
    INVENTORY: 'Kho hàng',
    SHIPPING: 'Vận chuyển GHN',
    SYSTEM: 'Hệ thống',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      {map[mod] || mod}
    </span>
  );
};

const getRoleBadge = (role) => {
  const map = {
    admin: { label: 'Quản trị viên', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    system: { label: 'Hệ thống', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  };
  const item = map[role] || { label: 'Quản trị viên', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const ActivityLogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-200 z-10">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Chi tiết nhật ký hoạt động</h2>
            {getActionBadge(log.action)}
            {getModuleBadge(log.module)}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                log.status === 'SUCCESS'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {log.status === 'SUCCESS' ? '✓ THÀNH CÔNG' : '✕ THẤT BẠI'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Mô tả hoạt động */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mô tả hành động</p>
            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{log.description}</p>
          </div>

          {/* Grid thông tin người thực hiện & đối tượng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Người thực hiện & Kỹ thuật */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2.5 text-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Người thực hiện & Thời gian
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Tên / Định danh:</span>
                <span className="font-semibold text-gray-900">{log.actorName || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Vai trò:</span>
                {getRoleBadge(log.actorRole)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời điểm ghi nhận:</span>
                <span className="font-medium text-gray-800 font-mono">{formatDate(log.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Địa chỉ IP:</span>
                <span className="font-mono font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                  {log.ipAddress || 'Không xác định'}
                </span>
              </div>
              {log.userAgent && (
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Trình duyệt / Thiết bị:</span>
                  <p className="text-[11px] text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-200 break-all">
                    {log.userAgent}
                  </p>
                </div>
              )}
            </div>

            {/* Cột 2: Đối tượng bị tác động */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2.5 text-xs">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Đối tượng liên quan
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Loại đối tượng:</span>
                <span className="font-semibold text-gray-900">{log.targetType || 'Hệ thống'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tên / Mã đối tượng:</span>
                <span className="font-semibold text-indigo-700">{log.targetName || '—'}</span>
              </div>
              {log.targetId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">ID đối tượng:</span>
                  <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={log.targetId}>
                    {log.targetId}
                  </span>
                </div>
              )}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Dữ liệu bổ sung:</span>
                  <pre className="text-[11px] bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-h-32 text-gray-700">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Bảng so sánh thay đổi dữ liệu trước / sau (Changes) */}
          {Array.isArray(log.changes) && log.changes.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Biến động dữ liệu chi tiết ({log.changes.length} trường thay đổi)
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                      <th className="py-2.5 px-3.5 text-left font-semibold w-1/4">Trường dữ liệu</th>
                      <th className="py-2.5 px-3.5 text-left font-semibold w-3/8 text-red-700 bg-red-50/40">
                        Giá trị cũ (Trước)
                      </th>
                      <th className="py-2.5 px-3.5 text-left font-semibold w-3/8 text-emerald-700 bg-emerald-50/40">
                        Giá trị mới (Sau)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {log.changes.map((c, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-gray-900">
                          <div>{c.fieldNameVi || c.field}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{c.field}</div>
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-700 bg-red-50/20">
                          {formatValue(c.oldValue)}
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-900 bg-emerald-50/20">
                          {formatValue(c.newValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 text-center">
              Thao tác này không làm thay đổi các trường dữ liệu so sánh hoặc là thao tác tạo mới / đăng nhập.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogDetailModal;
