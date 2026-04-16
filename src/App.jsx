import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Components & Layouts
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MenuManager from "./pages/MenuManager";
import OrderPOS from "./pages/OrderPOS";
import MainLayout from "./layouts/MainLayout";
import PrivateRoute from "./components/PrivateRoute";
import Settings from "./pages/Settings";
import TableManager from "./pages/TableManager";
import UserManager from "./pages/UserManager";
import OrderHistory from "./pages/OrderHistory";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<Login />} />

        {/* Route cần đăng nhập (Được bọc trong MainLayout) */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManager />} />
          <Route path="/orders" element={<OrderPOS />} />
          <Route path="/tables" element={<TableManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManager />} />
          <Route path="/order-history" element={<OrderHistory />} />
        </Route>

        {/* Route không tồn tại -> Về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </BrowserRouter>
  );
}

export default App;
