import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Danh sách menu
  const menuItems = [
    {
      path: "/order-history",
      label: "Đơn hàng hôm nay",
      icon: "📜",
    },
    { path: "/menu", label: "Quản lý Món ăn", icon: "🍔" },
    { path: "/orders", label: "Thu ngân (POS)", icon: "💻" },
    // { path: "/users", label: "Quản lý nhân sự", icon: "👤" },
  ];
  if (user.Role === "QuanLy") {
    menuItems.unshift({
      path: "/",
      label: "Tổng quan",
      icon: "📊",
    });
    menuItems.push({ path: "/tables", label: "Quản lý Bàn", icon: "🪑" });

    menuItems.push({ path: "/users", label: "Quản lý Nhân sự", icon: "👥" });
    menuItems.push({
      path: "/settings",
      label: "Cài đặt hệ thống",
      icon: "⚙️",
    });
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">PASTA IPOS</h1>
          <p className="text-xs text-gray-500 mt-1">Xin chào, {user.HoTen}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet /> {/* Nơi nội dung các trang con sẽ hiển thị */}
      </main>
    </div>
  );
};

export default MainLayout;
