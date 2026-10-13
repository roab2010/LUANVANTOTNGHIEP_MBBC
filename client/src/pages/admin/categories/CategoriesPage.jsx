import { useState, useEffect, useCallback } from 'react';
import { getCategories, deleteCategory } from '../../../services/categoryApi';
import CategoryFormModal from './CategoryFormModal';

// ============================================
// ICON COMPONENTS
// ============================================
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// ============================================
// FORMAT DATE HELPER
// ============================================
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ============================================
// CATEGORIES PAGE COMPONENT
// ============================================
const CategoriesPage = () => {
  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // FETCH CATEGORIES
  // ============================================
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await getCategories(params);
      const { categories: data, pagination: paginationData } = response.data.data;
      setCategories(data);
      setPagination(paginationData);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách danh mục';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteConfirm._id);
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err) {
      const message = err.response?.data?.message || 'Xóa danh mục thất bại';
      setError(message);
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total > 0 ? `${pagination.total} danh mục` : 'Chưa có danh mục nào'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 h-10 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 shrink-0"
        >
          <PlusIcon />
          Thêm danh mục
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên danh mục..."
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3.5 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
          <p className="text-sm text-danger-700 font-medium">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-gray-500 text-sm">Chưa có danh mục nào</p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <PlusIcon />
            Thêm danh mục đầu tiên
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Số lượng SP</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category._id}>
                  <td>
                    <span className="text-gray-400 text-xs">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </span>
                  </td>
                  <td>
                    <p className="font-medium text-gray-900">{category.name}</p>
                  </td>
                  <td>
                    <span className="text-gray-500 text-sm line-clamp-1">
                      {category.description || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                      (category.productCount ?? 0) > 0 ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {category.productCount ?? 0} sản phẩm
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${category.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {category.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-500 text-sm">{formatDate(category.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-150"
                        title="Sửa"
                      >
                        <EditIcon />
                      </button>
                      {category.status === 'inactive' && (
                        <button
                          onClick={() => setDeleteConfirm(category)}
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-150"
                          title="Xóa"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            Trang {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc muốn xóa danh mục <strong>{deleteConfirm.name}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-4 text-sm font-medium text-white bg-danger-500 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category form modal */}
      {showModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
