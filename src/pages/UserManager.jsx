import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosClient from "../api/axiosClient";
const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    HoTen: "",
    Username: "",
    Password: "",
    Role: "ThuNgan",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/users");
      // Lọc bỏ KhachHang ra khỏi danh sách quản lý (chỉ hiển thị nhân viên)
      const employeeOnly = (res.data || []).filter(
        (u) => u.Role !== "KhachHang",
      );
      setUsers(employeeOnly);
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Chỉ truyền các trường cần thiết cho nhân viên (HoTen, Username, Password, Role)
      await axiosClient.post("/users/register", formData);
      toast.success("Tạo tài khoản thành công!");
      setIsModalOpen(false);
      setFormData({ HoTen: "", Username: "", Password: "", Role: "ThuNgan" });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  // API Thay đổi quyền (Role)
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axiosClient.put(`/users/${userId}/role`, { Role: newRole });
      console.log(`Đã cập nhật quyền của user ${userId} thành ${newRole}`);
      toast.success("Cập nhật phân quyền thành công!");
      fetchUsers();
    } catch (error) {
      toast.error("Lỗi khi cập nhật quyền");
      console.error("Lỗi khi cập nhật quyền:", newRole, error);
    }
  };

  // API Xóa nhân viên
  const handleDeleteUser = async (userId, userName) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn thu hồi tài khoản của [${userName}] không? Thao tác này không thể hoàn tác.`,
      )
    ) {
      try {
        await axiosClient.delete(`/users/${userId}`);
        toast.success("Đã thu hồi tài khoản nhân viên!");
        fetchUsers();
      } catch (error) {
        toast.error("Lỗi khi xóa tài khoản");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* <div className="max-w-6xl mx-auto font-sans pb-10"> */}
      <div className="flex justify-between items-center mb-8 border-b pb-5 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản Lý Nhân Sự</h1>
          <p className="text-gray-500 mt-1">
            Cấp tài khoản và phân quyền cho nhân viên đăng nhập App/Web
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="text-xl">+</span> Cấp tài khoản mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Họ và Tên
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tên đăng nhập
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Phân quyền
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    Chưa có dữ liệu nhân viên
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isMainAdmin = user.Role === "QuanLy";

                  return (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-3 shadow-inner border border-blue-200">
                            {user.HoTen.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">
                              {user.HoTen}
                            </div>
                            {user.BaoMat?.SuDungVanTay && (
                              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                ✅ Đã kích hoạt Vân tay App
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 font-mono text-sm">
                          {user.Username}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Inline Dropdown để đổi Role */}
                        <select
                          value={user.Role}
                          onChange={(e) =>
                            handleUpdateRole(user._id, e.target.value)
                          }
                          disabled={isMainAdmin}
                          className={`text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer border shadow-sm transition
                            ${
                              user.Role === "QuanLy"
                                ? "bg-purple-50 text-purple-700 border-purple-200 focus:ring-2 focus:ring-purple-400"
                                : user.Role === "ThuNgan"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 focus:ring-2 focus:ring-blue-400"
                                  : user.Role === "Bep"
                                    ? "bg-orange-50 text-orange-700 border-orange-200 focus:ring-2 focus:ring-orange-400"
                                    : user.Role === "Bar"
                                      ? "bg-cyan-50 text-cyan-700 border-cyan-200 focus:ring-2 focus:ring-cyan-400"
                                      : "bg-green-50 text-green-700 border-green-200 focus:ring-2 focus:ring-green-400"
                            }
                            ${isMainAdmin ? "opacity-70 cursor-not-allowed" : ""}
                          `}
                        >
                          <option
                            value="QuanLy"
                            className="text-gray-800 bg-white"
                          >
                            👑 Quản lý
                          </option>
                          <option
                            value="ThuNgan"
                            className="text-gray-800 bg-white"
                          >
                            💻 Thu ngân
                          </option>
                          <option
                            value="Bep"
                            className="text-gray-800 bg-white"
                          >
                            🍳 Đầu Bếp
                          </option>
                          <option
                            value="Bar"
                            className="text-gray-800 bg-white"
                          >
                            🍹 Pha Chế (Bar)
                          </option>
                          <option
                            value="PhucVu"
                            className="text-gray-800 bg-white"
                          >
                            🏃 Phục vụ
                          </option>
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!isMainAdmin ? (
                          <button
                            onClick={() =>
                              handleDeleteUser(user._id, user.HoTen)
                            }
                            className="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 px-3 py-1.5 rounded-lg transition font-bold shadow-sm"
                          >
                            Xóa tài khoản
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Không thể xóa tài khoản Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm NV */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Cấp tài khoản Nhân viên
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 font-medium mb-2">
                💡 Nhân viên sẽ dùng Tên đăng nhập & Mật khẩu này để đăng nhập
                vào Web IPOS hoặc App mobile của nhân viên.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.HoTen}
                  onChange={(e) =>
                    setFormData({ ...formData, HoTen: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm lowercase"
                  value={formData.Username}
                  onChange={(e) =>
                    setFormData({ ...formData, Username: e.target.value })
                  }
                  placeholder="nhanvien_1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  value={formData.Password}
                  onChange={(e) =>
                    setFormData({ ...formData, Password: e.target.value })
                  }
                  placeholder="123456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Bộ phận (Phân quyền)
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Role}
                  onChange={(e) =>
                    setFormData({ ...formData, Role: e.target.value })
                  }
                >
                  <option value="ThuNgan">
                    💻 Thu Ngân (Dùng IPOS, Thanh toán)
                  </option>
                  <option value="Bep">🍳 Bếp (Chế biến món chính)</option>
                  <option value="Bar">🍹 Pha Chế (Chế biến đồ uống)</option>
                  <option value="PhucVu">🏃 Phục Vụ (Bưng bê, Xếp bàn)</option>
                  <option value="QuanLy">
                    👑 Quản Lý (Full quyền hệ thống)
                  </option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-md transition ${submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {submitting ? "Đang tạo..." : "Lưu tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
