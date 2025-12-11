import { Routes, Route } from "react-router-dom";
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
import ProfilePage from "../pages/admin/ProfilePage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes with MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="category" element={<Category />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route path="payment" element={<Payment />} />
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          {/* Public route for all users */}
          <Route path="profile" element={<ProfilePage />} />
          {/* Admin only routes */}
          <Route
            path="orders"
            element={
              <AdminRoute>
                <OrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="products"
            element={
              <AdminRoute>
                <ProductsPage />
              </AdminRoute>
            }
          />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <AdminRoute>
                <AnalyticsPage />
              </AdminRoute>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;

