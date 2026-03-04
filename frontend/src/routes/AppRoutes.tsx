import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import Home from "../pages/Home";
import Category from "../pages/Category";
import Detail from "../pages/Detail";
import Payment from "../pages/Payment";
import Dashboard from "../pages/Dashboard";
import OrdersPage from "../pages/admin/OrdersPage";
import ProductsPage from "../pages/admin/ProductsPage";
import UsersPage from "../pages/admin/UsersPage";
import TenantsPage from "../pages/admin/TenantsPage";
import TenantUsersPage from "../pages/admin/TenantUsersPage";
import CompanySettingsPage from "../pages/admin/CompanySettingsPage";
import StaffManagementPage from "../pages/admin/StaffManagementPage";
import EmployeesPage from "../pages/admin/EmployeesPage";
import LocationsPage from "../pages/admin/LocationsPage";
import CarTypesPage from "../pages/admin/CarTypesPage";
import ProfilePage from "../pages/ProfilePage";
import AdminProfilePage from "../pages/admin/ProfilePage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import ImportInvoicesPage from "../pages/admin/ImportInvoicesPage";
import ExportInvoicesPage from "../pages/admin/ExportInvoicesPage";
import ImportInvoiceForm from "../pages/admin/ImportInvoiceForm";
import ExportInvoiceForm from "../pages/admin/ExportInvoiceForm";
import NotificationsTester from "../components/NotificationsTester";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import TenantRoute from "./TenantRoute";

/**
 * AppRoutes - Routing với Multi-Tenant Isolation
 * 
 * TENANT ISOLATION RULES:
 * - SUPER_ADMIN: truy cập /admin/* (quản lý toàn bộ hệ thống + tenants)
 * - TENANT_ADMIN: truy cập /admin/tenants/:tenantId/* (tenant của mình) và /dashboard/*
 * - STAFF: truy cập /dashboard/* (tenant của mình)
 * 
 * SECURITY:
 * - TenantRoute: validate tenantId từ URL khớp với JWT
 * - AdminRoute: validate role
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="category" element={<Category />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* ========== TENANT (same UI as legacy) - /tenant/:tenantId/* ========== */}
      {/* Dùng lại MainLayout + pages cũ, chỉ khác prefix URL. */}
      <Route path="/tenant/:tenantId" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="category" element={<Category />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* ========== TENANT ADMIN ZONE - /tenant/:tenantId/dashboard/* ========== */}
      <Route
        path="/tenant/:tenantId/dashboard"
        element={
          <TenantRoute validateTenantId>
            <AdminLayout />
          </TenantRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route
          path="users"
          element={
            <TenantRoute validateTenantId>
              <TenantUsersPage />
            </TenantRoute>
          }
        />
        <Route
          path="users/:userId"
          element={
            <TenantRoute validateTenantId>
              <TenantUsersPage />
            </TenantRoute>
          }
        />

        <Route
          path="settings"
          element={
            <TenantRoute validateTenantId requiredRoles={["TENANT_ADMIN", "tenant_admin"]}>
              <CompanySettingsPage />
            </TenantRoute>
          }
        />
        <Route
          path="staff"
          element={
            <TenantRoute validateTenantId requiredRoles={["TENANT_ADMIN", "tenant_admin"]}>
              <StaffManagementPage />
            </TenantRoute>
          }
        />
        <Route
          path="employees"
          element={
            <TenantRoute validateTenantId requiredRoles={["TENANT_ADMIN", "tenant_admin"]}>
              <EmployeesPage />
            </TenantRoute>
          }
        />

        <Route
          path="locations"
          element={
            <TenantRoute validateTenantId>
              <LocationsPage />
            </TenantRoute>
          }
        />
        <Route
          path="car-types"
          element={
            <TenantRoute validateTenantId>
              <CarTypesPage />
            </TenantRoute>
          }
        />

        <Route
          path="orders"
          element={
            <TenantRoute validateTenantId>
              <OrdersPage />
            </TenantRoute>
          }
        />
        <Route
          path="products"
          element={
            <TenantRoute validateTenantId>
              <ProductsPage />
            </TenantRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <TenantRoute validateTenantId>
              <AnalyticsPage />
            </TenantRoute>
          }
        />

        <Route
          path="import-invoices"
          element={
            <TenantRoute validateTenantId>
              <ImportInvoicesPage />
            </TenantRoute>
          }
        />
        <Route
          path="import-invoices/create"
          element={
            <TenantRoute validateTenantId>
              <ImportInvoiceForm />
            </TenantRoute>
          }
        />
        <Route
          path="import-invoices/edit/:ma_hdn"
          element={
            <TenantRoute validateTenantId>
              <ImportInvoiceForm />
            </TenantRoute>
          }
        />
        <Route
          path="export-invoices"
          element={
            <TenantRoute validateTenantId>
              <ExportInvoicesPage />
            </TenantRoute>
          }
        />
        <Route
          path="export-invoices/create"
          element={
            <TenantRoute validateTenantId>
              <ExportInvoiceForm />
            </TenantRoute>
          }
        />
        <Route
          path="export-invoices/edit/:ma_hdx"
          element={
            <TenantRoute validateTenantId>
              <ExportInvoiceForm />
            </TenantRoute>
          }
        />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="payment" element={<Payment />} />
        <Route path="/tenant/:tenantId/payment" element={<Payment />} />

        {/* ========== SUPER ADMIN ROUTES - /admin/* ========== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<AdminProfilePage />} />

          {/* ========== Tenant Management - Super Admin only ========== */}
          <Route
            path="tenants"
            element={
              <AdminRoute requiredRoles={["SUPER_ADMIN", "super_admin"]}>
                <TenantsPage />
              </AdminRoute>
            }
          />

          {/* ========== Tenant Users - Super Admin or Tenant Admin ========== */}
          {/* Sử dụng TenantRoute để validate cross-tenant access */}
          <Route
            path="tenants/:tenantId"
            element={
              <TenantRoute validateTenantId allowSuperAdmin>
                <TenantUsersPage />
              </TenantRoute>
            }
          />
          <Route
            path="tenants/:tenantId/users"
            element={
              <TenantRoute validateTenantId allowSuperAdmin>
                <TenantUsersPage />
              </TenantRoute>
            }
          />
          <Route
            path="tenants/:tenantId/users/:userId"
            element={
              <TenantRoute validateTenantId allowSuperAdmin>
                <TenantUsersPage />
              </TenantRoute>
            }
          />

          {/* ========== Global Users - Super Admin only ========== */}
          <Route
            path="users"
            element={
              <AdminRoute requiredRoles={["SUPER_ADMIN", "super_admin"]}>
                <UsersPage />
              </AdminRoute>
            }
          />

          {/* ========== Global Analytics - Super Admin only ========== */}
          <Route
            path="analytics"
            element={
              <AdminRoute requiredRoles={["SUPER_ADMIN", "super_admin"]}>
                <AnalyticsPage />
              </AdminRoute>
            }
          />

          {/* ========== Notifications Tester - Super Admin only ========== */}
          <Route
            path="notifications-test"
            element={
              <AdminRoute requiredRoles={["SUPER_ADMIN", "super_admin"]}>
                <NotificationsTester />
              </AdminRoute>
            }
          />
        </Route>

        {/* ========== TENANT ADMIN / COMPANY ROUTES - /dashboard/* ========== */}
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* ========== Company Settings - TENANT_ADMIN only ========== */}
          <Route
            path="settings"
            element={
              <AdminRoute>
                <CompanySettingsPage />
              </AdminRoute>
            }
          />

          {/* ========== Staff Management - TENANT_ADMIN only ========== */}
          <Route
            path="staff"
            element={
              <AdminRoute>
                <StaffManagementPage />
              </AdminRoute>
            }
          />

          {/* ========== Employees Management - TENANT_ADMIN only ========== */}
          <Route
            path="employees"
            element={
              <AdminRoute>
                <EmployeesPage />
              </AdminRoute>
            }
          />

          {/* ========== Locations - Tenant Admin ========== */}
          <Route
            path="locations"
            element={
              <AdminRoute>
                <LocationsPage />
              </AdminRoute>
            }
          />

          {/* ========== Car Types - Tenant Admin ========== */}
          <Route
            path="car-types"
            element={
              <AdminRoute>
                <CarTypesPage />
              </AdminRoute>
            }
          />

          {/* ========== Orders - Tenant Admin ========== */}
          <Route
            path="orders"
            element={
              <AdminRoute>
                <OrdersPage />
              </AdminRoute>
            }
          />

          {/* ========== Products - Tenant Admin ========== */}
          <Route
            path="products"
            element={
              <AdminRoute>
                <ProductsPage />
              </AdminRoute>
            }
          />

          {/* ========== Customers (Users) - Tenant Admin ========== */}
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />

          {/* ========== Tenant Analytics - Tenant Admin ========== */}
          <Route
            path="analytics"
            element={
              <AdminRoute>
                <AnalyticsPage />
              </AdminRoute>
            }
          />

          {/* ========== Invoice Management - Tenant Admin ========== */}
          <Route
            path="import-invoices"
            element={
              <AdminRoute>
                <ImportInvoicesPage />
              </AdminRoute>
            }
          />
          <Route
            path="import-invoices/create"
            element={
              <AdminRoute>
                <ImportInvoiceForm />
              </AdminRoute>
            }
          />
          <Route
            path="import-invoices/edit/:ma_hdn"
            element={
              <AdminRoute>
                <ImportInvoiceForm />
              </AdminRoute>
            }
          />
          <Route
            path="export-invoices"
            element={
              <AdminRoute>
                <ExportInvoicesPage />
              </AdminRoute>
            }
          />
          <Route
            path="export-invoices/create"
            element={
              <AdminRoute>
                <ExportInvoiceForm />
              </AdminRoute>
            }
          />
          <Route
            path="export-invoices/edit/:ma_hdx"
            element={
              <AdminRoute>
                <ExportInvoiceForm />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

