import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsPage from './pages/admin/products/ProductsPage';
import CategoriesPage from './pages/admin/categories/CategoriesPage';
import SuppliersPage from './pages/admin/suppliers/SuppliersPage';
import ImportReceiptsPage from './pages/admin/import/ImportReceiptsPage';
import CustomersPage from './pages/admin/customers/CustomersPage';
import WarehousePage from './pages/admin/warehouse/WarehousePage';
import OrdersPage from './pages/admin/orders/OrdersPage';
import StatisticsPage from './pages/admin/statistics/StatisticsPage';
import CustomerHome from './pages/customer/CustomerHome';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* === Routes công khai === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* === Routes Khách hàng / Storefront M.B.B.C === */}
          <Route path="/" element={<CustomerHome />} />
          <Route path="/customer" element={<CustomerHome />} />

          {/* === Routes Admin (cần đăng nhập + role admin) === */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Nested routes render trong <Outlet /> của AdminLayout */}
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="import-receipts" element={<ImportReceiptsPage />} />
            <Route path="warehouse" element={<WarehousePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
          </Route>

          {/* === 404 → Về trang chủ === */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
