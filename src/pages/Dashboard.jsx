import React, { useState, useEffect } from "react";

import axiosClient from "../api/axiosClient";

// Component hiển thị thẻ thống kê nhỏ
const StatCard = ({ title, value, subtext, color, icon }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
    <div>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
      {subtext && (
        <p className="mt-2 text-xs font-semibold text-emerald-500 bg-emerald-50 inline-block px-2 py-1 rounded">
          {subtext}
        </p>
      )}
    </div>
    <div className="text-5xl opacity-80">{icon}</div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("day"); // Mặc định là xem theo ngày

  // Gọi API mỗi khi timeframe thay đổi
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get("/reports/dashboard", {
          params: { timeframe },
        });

        setData(response.data?.data || response.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      {/* <div className="max-w-7xl mx-auto font-sans pb-10 relative"> */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Báo cáo Tổng quan
          </h1>
          <p className="text-gray-500 mt-1">
            Dữ liệu hoạt động kinh doanh tính đến thời điểm hiện tại
          </p>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <span className="text-sm font-bold text-gray-500 pl-2">
            📅 Xem theo:
          </span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border-none bg-blue-50 text-blue-700 font-bold rounded-lg text-sm px-4 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
          >
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
          </select>
        </div>
      </div>

      {/* Hiệu ứng mờ khi đang tải lại dữ liệu */}
      <div
        className={`transition-opacity duration-300 ${loading && data ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        {/* Nếu chưa có data lần đầu thì hiện vòng xoay */}
        {!data && loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-blue-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="font-semibold">Đang tổng hợp dữ liệu...</p>
          </div>
        ) : data ? (
          <>
            {/* THẺ CHỈ SỐ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Tổng Doanh Thu"
                value={`${data.tongDoanhThu.toLocaleString()} đ`}
                subtext="Đã cập nhật mới nhất"
                color="text-blue-700"
                icon="💰"
              />
              <StatCard
                title="Đơn Hàng Đã Xử Lý"
                value={data.tongDonHang}
                subtext="Tất cả đơn hàng đã hoàn thành"
                color="text-emerald-600"
                icon="🧾"
              />
              <StatCard
                title="Khách Hàng Mới (Zalo)"
                value={data.khachHangMoi}
                subtext="Truy cập từ mã QR"
                color="text-purple-600"
                icon="📱"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* BIỂU ĐỒ DOANH THU (CSS CHART) */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="mb-8 border-b pb-4 border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">
                    Biểu đồ Doanh thu
                  </h3>
                  <p className="text-sm text-gray-500">
                    Phân tích dòng tiền theo thời gian
                  </p>
                </div>

                <div className="flex-1 min-h-[250px] flex items-end justify-between gap-1 sm:gap-2 px-2 pb-2">
                  {data.bieuDoDoanhThu.map((item, idx) => {
                    // Tránh lỗi chia cho 0 nếu chưa có doanh thu
                    const safeMax = item.max > 0 ? item.max : 1;
                    const heightPercent = (item.tien / safeMax) * 100;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center flex-1 h-full group relative"
                      >
                        {/* Tooltip khi hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs font-bold py-1.5 px-2.5 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          {item.tien.toLocaleString()} đ
                        </div>
                        {/* Cột biểu đồ */}
                        <div className="w-full relative flex justify-center h-full items-end">
                          <div
                            className={`w-[85%] md:w-[70%] rounded-t-lg transition-all duration-700 ease-out bg-blue-200 group-hover:bg-blue-400
                              ${heightPercent > 0 ? "min-h-[4px]" : ""}
                            `}
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                        {/* Nhãn trục X */}
                        <span className="mt-3 text-[10px] sm:text-xs font-bold text-gray-500 truncate">
                          {item.thu}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BẢNG MÓN BÁN CHẠY */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-5 border-b pb-4 border-gray-100">
                  🔥 Món Bán Chạy Nhất
                </h3>

                {data.monBanChay.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                    Chưa có dữ liệu đơn hàng
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    {data.monBanChay.map((mon, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition border border-transparent hover:border-orange-100"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm
                            ${
                              idx === 0
                                ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white"
                                : idx === 1
                                  ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                                  : idx === 2
                                    ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white"
                                    : "bg-white text-gray-500 border border-gray-200"
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-1">
                              {mon.ten}
                            </p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {mon.sl} lượt gọi
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-black text-orange-600 text-sm bg-white px-2 py-1 rounded-lg border border-orange-100 shadow-sm whitespace-nowrap ml-2">
                          {mon.tongTien.toLocaleString()} đ
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="w-full mt-6 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 transition text-sm flex justify-center items-center gap-2"
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/api/reports/export?timeframe=${timeframe}`,
                      "_blank",
                    )
                  }
                >
                  <span>📊</span> Xuất báo cáo chi tiết (Excel)
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
