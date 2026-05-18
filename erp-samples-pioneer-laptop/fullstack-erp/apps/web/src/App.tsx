import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/inventory/ProductsPage';
import WarehousePage from './pages/inventory/WarehousePage';
import CustomersPage from './pages/sales/CustomersPage';
import SaleOrdersPage from './pages/sales/SaleOrdersPage';
import VendorsPage from './pages/purchasing/VendorsPage';
import PurchaseOrdersPage from './pages/purchasing/PurchaseOrdersPage';
import InvoicesPage from './pages/finance/InvoicesPage';
import AccountsPage from './pages/finance/AccountsPage';
import EmployeesPage from './pages/hr/EmployeesPage';
import PayrollPage from './pages/hr/PayrollPage';
import WorkOrdersPage from './pages/production/WorkOrdersPage';
import BomsPage from './pages/production/BomsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {/* Inventory */}
          <Route path="inventory/products" element={<ProductsPage />} />
          <Route path="inventory/warehouse" element={<WarehousePage />} />
          {/* Sales */}
          <Route path="sales/orders" element={<SaleOrdersPage />} />
          <Route path="sales/customers" element={<CustomersPage />} />
          {/* Purchasing */}
          <Route path="purchasing/orders" element={<PurchaseOrdersPage />} />
          <Route path="purchasing/vendors" element={<VendorsPage />} />
          {/* Finance */}
          <Route path="finance/invoices" element={<InvoicesPage />} />
          <Route path="finance/accounts" element={<AccountsPage />} />
          {/* HR */}
          <Route path="hr/employees" element={<EmployeesPage />} />
          <Route path="hr/payroll" element={<PayrollPage />} />
          {/* Production */}
          <Route path="production/work-orders" element={<WorkOrdersPage />} />
          <Route path="production/boms" element={<BomsPage />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
