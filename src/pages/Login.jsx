import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosClient.post("/users/login", {
        username,
        password,
      });

      if (res && res.data) {
        const userRole = res.data.Role;

        if (userRole !== "QuanLy" && userRole !== "ThuNgan") {
          toast.error("Tài khoản của bạn không có quyền truy cập hệ thống!", {
            autoClose: 3000,
          });
          return;
        }

        localStorage.setItem("token", res.data.Token);
        localStorage.setItem("user", JSON.stringify(res.data));

        toast.success(`Xin chào ${res.data.HoTen}`, {});

        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err) {
      setError(true);

      toast.error("Sai tài khoản hoặc mật khẩu!", {
        autoClose: 3000,
      });

      passwordRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Đăng Nhập</h2>
          <p className="text-sm text-gray-500 mt-2">
            Hệ thống quản lý nhà hàng
          </p>
        </div>

        <form className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tài khoản
            </label>

            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 
              ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>

            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`mt-1 w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 
                ${
                  error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition ${
              loading ? "opacity-70 cursor-wait" : ""
            }`}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Đang xác thực...
              </>
            ) : (
              "Đăng Nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
