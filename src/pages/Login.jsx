import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gọi API thật từ Backend
      const res = await axiosClient.post("/users/login", {
        username,
        password,
      });

      if (res && res.data) {
        const userRole = res.data.Role;
        if (userRole !== "QuanLy" && userRole !== "ThuNgan") {
          toast.error(
            "Tài khoản của bạn không có quyền truy cập trang quản trị Web!",
          );
          setLoading(false);
          return;
        }
        localStorage.setItem("token", res.data.Token);
        localStorage.setItem("user", JSON.stringify(res.data));

        toast.success(`Đăng nhập thành công! Xin Chào ${res.data.HoTen}`);
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.error ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Đăng Nhập</h2>
          <p className="text-sm text-gray-500 mt-2">
            Hệ thống quản lý nhà hàng
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Vui lòng nhập tài khoản và mật khẩu để truy cập
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tài khoản
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all ${loading ? "opacity-70 cursor-wait" : ""}`}
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
