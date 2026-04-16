import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";
import {
  FaClipboardList,
  FaMoneyBillWave,
  FaCreditCard,
  FaRegClock,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10; // Hiển thị 10 đơn mỗi trang cho gọn

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/orders/today");
      // Lưu ý: axiosClient của bạn trả về data trực tiếp nhờ interceptor
      if (res && res.success) {
        setOrders(res.data || []);
        setSummary(res.summary || { totalOrders: 0, totalRevenue: 0 });
      }
    } catch (error) {
      console.error("Lỗi API History:", error);
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 60000);
    return () => clearInterval(interval);
  }, []);

  // 1. Tính toán doanh thu (Dùng optional chaining để tránh lỗi)
  const cashRevenue = (orders || [])
    .filter(
      (o) =>
        o.ThanhToan?.TrangThai === "DaThanhToan" &&
        o.ThanhToan?.PhuongThuc === "TienMat",
    )
    .reduce((sum, o) => sum + (o.TongTien || 0), 0);

  const transferRevenue = (orders || [])
    .filter(
      (o) =>
        o.ThanhToan?.TrangThai === "DaThanhToan" &&
        o.ThanhToan?.PhuongThuc === "ChuyenKhoan",
    )
    .reduce((sum, o) => sum + (o.TongTien || 0), 0);

  // 2. Logic Lọc đơn hàng
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    return order.ThanhToan?.TrangThai === filterStatus;
  });

  // 3. Logic Phân trang (ĐẶT Ở ĐÂY ĐỂ TRÁNH LỖI REFERENCE)
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder,
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // if (loading)
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //     </div>
  //   );

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER BÁO CÁO NHANH */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Báo cáo đơn hàng hôm nay
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Thống kê ngày - {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-red-100 border border-red-200 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-[9px] text-red-400 font-bold uppercase">
              Tổng đơn
            </p>
            <p className="font-black text-slate-700 leading-tight">
              {summary.totalOrders}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-[9px] text-emerald-600 font-bold uppercase">
              Tiền mặt
            </p>
            <p className="font-black text-emerald-700 leading-tight">
              {cashRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-[9px] text-indigo-600 font-bold uppercase">
              Chuyển khoản
            </p>
            <p className="font-black text-indigo-700 leading-tight">
              {transferRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {["all", "DaThanhToan", "ChuaThanhToan"].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setFilterStatus(mode);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  filterStatus === mode
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mode === "all"
                  ? "Tất cả"
                  : mode === "DaThanhToan"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchHistory}
            className="text-blue-600 text-[10px] font-black hover:underline uppercase"
          >
            Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                  Mã đơn / Bàn
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                  Chi tiết món & Topping
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-mono text-[11px] font-bold text-slate-400 uppercase">
                      #{order._id.slice(-6)}
                    </p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      {order.BanId?.SoBan || "Mang về"}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <FaRegClock size={9} />{" "}
                      {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.ChiTietMon.map((food, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[10px] font-black text-blue-600 mt-0.5">
                            {food.SoLuong}x
                          </span>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-700">
                              {food.TenMon?.vi}
                            </span>
                            {food.TuyChonDaChon?.length > 0 && (
                              <span className="ml-2 text-[9px] text-slate-400 italic">
                                (+{" "}
                                {food.TuyChonDaChon.map((opt) => opt.Ten).join(
                                  ", ",
                                )}
                                )
                              </span>
                            )}
                            {food.GhiChu && (
                              <p className="text-[9px] text-rose-400 italic font-medium flex items-center gap-1">
                                <FaExclamationCircle size={8} /> {food.GhiChu}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <p className="text-sm font-black text-slate-800">
                      {order.TongTien.toLocaleString()}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          order.ThanhToan?.TrangThai === "DaThanhToan"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {order.ThanhToan?.TrangThai === "DaThanhToan"
                          ? "Đã thanh toán"
                          : "Chưa thanh toán"}
                      </span>
                      {order.ThanhToan?.TrangThai === "DaThanhToan" && (
                        <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase">
                          {order.ThanhToan?.PhuongThuc === "TienMat" ? (
                            <FaMoneyBillWave size={10} />
                          ) : (
                            <FaCreditCard size={10} />
                          )}
                          {order.ThanhToan?.PhuongThuc === "TienMat"
                            ? "Tiền mặt"
                            : "Chuyển khoản"}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG GỌN GÀNG */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-20"
              >
                <FaChevronLeft size={12} />
              </button>

              <div className="flex items-center gap-1 px-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === i + 1
                        ? "bg-slate-900 text-white"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-20"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
