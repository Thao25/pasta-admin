import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import axiosClient from "../api/axiosClient";
const OrderPOS = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restaurantConfig, setRestaurantConfig] = useState(null);

  // State cho Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ SoBan: "", KhuVuc: "Tầng 1" });
  const [addingTable, setAddingTable] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // 1. Tải cấu hình nhà hàng (Bank, Khu vực, Tên, Địa chỉ...)
  const fetchConfig = async () => {
    try {
      const res = await axiosClient.get("/restaurant");
      const data = res.data?.data || res.data || res;
      setRestaurantConfig(data);

      if (data?.DanhSachKhuVuc?.length > 0) {
        setNewTable((prev) => ({ ...prev, KhuVuc: data.DanhSachKhuVuc[0] }));
      }
    } catch (error) {
      console.error("Lỗi API tải cấu hình:", error);
    }
  };

  // 2. Tải danh sách bàn từ Backend
  const fetchTables = async () => {
    try {
      const res = await axiosClient.get("/tables");
      const data = res.data?.data || res.data || res || [];
      setTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi API tải sơ đồ bàn:", error);
      toast.error(
        "Không thể tải sơ đồ bàn. Vui lòng kiểm tra kết nối Backend!",
      );
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchTables();
    const interval = setInterval(() => {
      fetchTables();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Gom nhóm bàn theo khu vực
  const groupedTables = tables.reduce((groups, table) => {
    const khuVuc = table.KhuVuc || "Khu vực khác";
    if (!groups[khuVuc]) groups[khuVuc] = [];
    groups[khuVuc].push(table);
    return groups;
  }, {});

  // 3. Khi Thu ngân bấm chọn 1 bàn
  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    setCurrentOrder(null);

    if (table.OrderHienTaiId) {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/orders/${table.OrderHienTaiId}`);
        const payload = res.data || res;
        const actualOrder = payload.data || payload;
        setCurrentOrder(actualOrder);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
        toast.error("Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    }
  };

  // 4. Xử lý Thanh toán
  const handlePayment = async (method) => {
    if (!currentOrder) return;

    if (method === "ChuyenKhoan") {
      setIsQRModalOpen(true);
      return;
    }

    if (window.confirm(`Xác nhận thu TIỀN MẶT bàn ${selectedTable.SoBan}?`)) {
      executePayment("TienMat");
    }
  };

  const executePayment = async (method) => {
    try {
      await axiosClient.put(`/orders/${currentOrder._id}`, {
        ThanhToan: {
          TrangThai: "DaThanhToan",
          PhuongThuc: method,
          ThoiGian: new Date(),
        },
      });

      toast.success(
        `Thanh toán ${method === "TienMat" ? "Tiền mặt" : "Chuyển khoản"} thành công!`,
      );

      setIsQRModalOpen(false);
      setSelectedTable(null);
      setCurrentOrder(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xử lý thanh toán");
    }
  };

  // 5. In hóa đơn (Sử dụng Tên nhà hàng & Địa chỉ từ API + Xử lý Song ngữ)
  const handlePrintInvoice = (language = "vi") => {
    if (!currentOrder || !selectedTable) return;

    const shortOrderId = currentOrder._id
      .substring(currentOrder._id.length - 6)
      .toUpperCase();

    const tenNhaHang = restaurantConfig?.TenNhaHang || "NHÀ HÀNG PASTA";
    const diaChi = restaurantConfig?.DiaChi || "Địa chỉ chưa cập nhật";

    // Text đa ngôn ngữ cho Layout hóa đơn
    const t = {
      vi: {
        title: "HÓA ĐƠN",
        table: "Bàn",
        orderId: "Mã HĐ",
        date: "Ngày",
        item: "Món",
        qty: "SL",
        total: "T.Tiền",
        grandTotal: "TỔNG CỘNG",
        thanks: "Cảm ơn quý khách và hẹn gặp lại!",
      },
      en: {
        title: "PASTA RECEIPT",
        table: "Table",
        orderId: "Order ID",
        date: "Date",
        item: "Item",
        qty: "Qty",
        total: "Amount",
        grandTotal: "TOTAL",
        thanks: "Thank you & See you again!",
      },
    };

    const lang = t[language];

    const printWindow = window.open("", "_blank");
    const invoiceHtml = `
      <html>
        <head>
          <title>Hóa Đơn - ${selectedTable.SoBan}</title>
          <style>
            @page { margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 15px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { text-align: left; padding: 4px 0; font-size: 13px; vertical-align: top; }
            .right { text-align: right; }
            .txt-large { font-size: 18px; }
            .txt-medium { font-size: 14px; }
            .mb-2 { margin-bottom: 5px; }
            .item-name-en { font-size: 11px; font-style: italic; color: #555; }
          </style>
        </head>
        <body>
          <div class="center bold txt-large mb-2">${tenNhaHang.toUpperCase()}</div>
          <div class="center txt-medium">Đ/C: ${diaChi}</div>
          <div class="line"></div>
          
          <div class="center bold txt-large mb-2">${lang.title}</div>
          <div><span class="bold">${lang.table}:</span> ${selectedTable.SoBan}</div>
          <div><span class="bold">${lang.orderId}:</span> #${shortOrderId}</div>
          <div><span class="bold">${lang.date}:</span> ${new Date().toLocaleString("vi-VN")}</div>
          
          <div class="line"></div>
          <table>
            <tr>
              <th style="width: 50%">${lang.item}</th>
              <th class="right" style="width: 15%">${lang.qty}</th>
              <th class="right" style="width: 35%">${lang.total}</th>
            </tr>
            ${currentOrder.ChiTietMon.map((item) => {
              // Hiển thị tên món theo ngôn ngữ được chọn
              const itemName =
                language === "vi"
                  ? item.TenMon?.vi || "Món ăn"
                  : item.TenMon?.en || item.TenMon?.vi || "Item";
              // Hiển thị thêm ngôn ngữ phụ ở dưới
              const subItemName =
                language === "vi" ? item.TenMon?.en : item.TenMon?.vi;

              return `
                <tr>
                  <td>
                    <div class="bold">${itemName}</div>
                    ${subItemName ? `<div class="item-name-en">${subItemName}</div>` : ""}
                    ${item.TuyChonDaChon?.length > 0 ? `<div style="font-size: 11px; color: #555;">+ ${item.TuyChonDaChon.map((o) => o.Ten).join(", ")}</div>` : ""}
                  </td>
                  <td class="center">${item.SoLuong}</td>
                  <td class="right">${(item.GiaDonVi * item.SoLuong).toLocaleString()}</td>
                </tr>
              `;
            }).join("")}
          </table>
          <div class="line"></div>
          
          <div style="display: flex; justify-content: space-between; font-size: 16px;" class="bold">
            <span>${lang.grandTotal}:</span>
            <span>${currentOrder.TongTien.toLocaleString()} đ</span>
          </div>
          <div class="line"></div>
          
          <div class="center italic" style="font-size: 12px; margin-top: 15px;">
            ${lang.thanks}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  // --- HÀM HỖ TRỢ TRẠNG THÁI BÀN (Màu sắc và Text) ---
  const getStatusColor = (status) => {
    switch (status) {
      case "Trống":
        return "bg-green-500";
      case "Có Khách":
        return "bg-red-500";
      case "Chờ thanh toán":
        return "bg-yellow-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Trống":
        return "Trống";
      case "Có Khách":
        return "Có Khách";
      case "Chờ thanh toán":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

  // --- HÀM HỖ TRỢ TRẠNG THÁI ORDER (BILL) ---
  const getOrderBadge = (status) => {
    switch (status) {
      case "ChoXuLy":
        return (
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-200 shadow-sm flex items-center gap-1">
            <span className="animate-pulse">⏳</span> Chờ xử lý
          </span>
        );
      case "DangCheBien":
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-200 shadow-sm flex items-center gap-1">
            🍳 Đang chế biến
          </span>
        );
      case "DaLamXong":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-[10px] font-bold border border-yellow-200 shadow-sm flex items-center gap-1">
            🍽️ Đã làm xong
          </span>
        );
      case "DaPhucVu":
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-[10px] font-bold border border-purple-200 shadow-sm flex items-center gap-1">
            🍴 Đã phục vụ
          </span>
        );
      case "HoanTat":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-[10px] font-bold border border-green-200 shadow-sm flex items-center gap-1">
            ✅ Hoàn tất
          </span>
        );
      case "DaHuy":
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-[10px] font-bold border border-red-200 shadow-sm flex items-center gap-1">
            ❌ Đã hủy
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-200 shadow-sm">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 font-sans relative">
      {/* ===== CỘT TRÁI: SƠ ĐỒ BÀN ===== */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sơ đồ bàn</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý trạng thái và khách hàng theo khu vực
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-3 space-y-8 custom-scrollbar">
          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-6xl mb-4">🪑</span>
              <p className="text-lg">
                Chưa có bàn nào. Hãy thêm bàn để bắt đầu!
              </p>
            </div>
          ) : (
            Object.entries(groupedTables).map(([khuVuc, tablesInZone]) => (
              <div
                key={khuVuc}
                className="bg-gray-50/50 p-4 rounded-xl border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                  {khuVuc.toUpperCase()}
                  <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                    {tablesInZone.length} bàn
                  </span>
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {tablesInZone.map((table) => {
                    const status = table.TrangThai;
                    const isTrong = status === "Trong" || status === "Trống";
                    const isCoKhach = status === "Có Khách";

                    return (
                      <div
                        key={table._id}
                        onClick={() => handleSelectTable(table)}
                        className={`
                          group p-5 rounded-2xl cursor-pointer border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] relative shadow-sm hover:shadow-md
                          ${selectedTable?._id === table._id ? "ring-4 ring-blue-300 border-blue-400 transform scale-[1.02]" : "border-transparent"}
                          ${
                            isTrong
                              ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-100"
                              : isCoKhach
                                ? "bg-rose-50 hover:bg-rose-100 border-rose-100"
                                : "bg-amber-50 hover:bg-amber-100 border-amber-100"
                          }
                        `}
                      >
                        <span className="text-5xl mb-3 drop-shadow-sm transition-transform duration-200 group-hover:scale-110">
                          {isTrong ? "🪑" : isCoKhach ? "🍽️" : "🧾"}
                        </span>
                        <span className="font-extrabold text-gray-800 text-lg">
                          {table.SoBan}
                        </span>

                        {/* BADGE CHẤM TRÒN + TEXT BÊN TRÊN GÓC PHẢI */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-gray-100">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shadow-inner ${getStatusColor(status)}`}
                          ></span>
                          <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== CỘT PHẢI: CHI TIẾT HÓA ĐƠN ===== */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-3 flex items-center justify-between">
          <span>
            {selectedTable
              ? `Chi tiết: ${selectedTable.SoBan}`
              : "Chưa chọn bàn"}
          </span>
          {currentOrder && (
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded border border-blue-200">
              #
              {currentOrder._id
                .substring(currentOrder._id.length - 6)
                .toUpperCase()}
            </span>
          )}
        </h2>

        {selectedTable && !selectedTable.OrderHienTaiId && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <span className="text-6xl mb-4 opacity-50">✨</span>
            <p className="font-medium text-xl text-gray-600">
              Bàn này đang trống
            </p>
            <p className="text-sm mt-2 text-center text-gray-400 px-4">
              Khách hàng quét QR tại bàn để gọi món.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-blue-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        )}

        {currentOrder && !loading && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* TỐI ƯU KHOẢNG CÁCH: Danh sách món ăn được kéo giãn tối đa */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-2 pr-2 custom-scrollbar">
              {currentOrder.ChiTietMon?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-bold text-gray-800 text-base">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs mr-2 border border-blue-200">
                        {item.SoLuong}x
                      </span>
                      {item.TenMon?.vi || item.TenMon || "Món ăn"}
                    </p>

                    {item.TuyChonDaChon?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 pl-8">
                        +{" "}
                        {item.TuyChonDaChon.map((opt) => `${opt.Ten}`).join(
                          ", ",
                        )}
                      </p>
                    )}

                    {item.GhiChu && (
                      <p className="text-xs text-rose-500 italic mt-1 pl-8 font-medium">
                        * Ghi chú: {item.GhiChu}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 mt-1 text-base">
                    {(item.GiaDonVi * item.SoLuong).toLocaleString()} đ
                  </p>
                </div>
              ))}
            </div>

            {/* TỐI ƯU KHOẢNG CÁCH: Khu vực trạng thái & thanh toán thu gọn hơn */}
            <div className="border-t border-gray-200 pt-3 bg-white mt-auto">
              {/* Tóm tắt trạng thái và tổng tiền */}
              <div className="flex justify-between items-center mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Trạng thái đơn hàng
                  </span>
                  {getOrderBadge(currentOrder.TrangThaiOrder)}
                </div>
                <div className="text-right flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Tổng thanh toán
                  </span>
                  <span className="text-xl font-black text-blue-700 leading-none">
                    {currentOrder.TongTien?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Các thao tác (In + Thanh toán) */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handlePrintInvoice("vi")}
                    className="flex-1 bg-white text-gray-700 py-2 rounded-xl hover:bg-gray-50 font-bold border border-gray-300 flex items-center justify-center gap-2 transition text-sm shadow-sm"
                  >
                    <span>🖨️</span> In HĐ (VI)
                  </button>
                  <button
                    onClick={() => handlePrintInvoice("en")}
                    className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-xl hover:bg-indigo-100 font-bold border border-indigo-200 flex items-center justify-center gap-2 transition text-sm shadow-sm"
                  >
                    <span>🖨️</span> In HĐ (EN)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handlePayment("TienMat")}
                    className="bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 font-bold shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 text-[15px]"
                  >
                    <span className="text-lg">💵</span> Tiền Mặt
                  </button>
                  <button
                    onClick={() => handlePayment("ChuyenKhoan")}
                    className="bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-bold shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 text-[15px]"
                  >
                    <span className="text-lg">💳</span> Mã QR (CK)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedTable && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <span className="text-7xl mb-4 opacity-50">👈</span>
            <p className="font-medium text-lg text-gray-400">
              Vui lòng chọn bàn trên sơ đồ
            </p>
          </div>
        )}
      </div>

      {/* ===== MODAL TẠO QR CHUYỂN KHOẢN ===== */}
      {isQRModalOpen && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up flex flex-col items-center p-6 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              Mã QR Thanh Toán
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Quét mã QR để thanh toán
            </p>

            <div className="border-4 border-indigo-100 rounded-xl p-2 mb-4 bg-white">
              {/* KIỂM TRA & HIỂN THỊ VIETQR DỰA VÀO CẤU HÌNH API */}
              {restaurantConfig?.ThongTinNganHang?.BankId &&
              restaurantConfig?.ThongTinNganHang?.AccountNo ? (
                <img
                  src={`https://img.vietqr.io/image/${restaurantConfig.ThongTinNganHang.BankId}-${restaurantConfig.ThongTinNganHang.AccountNo}-compact2.png?amount=${currentOrder.TongTien}&addInfo=Thanh toan hoa don ${currentOrder._id.substring(currentOrder._id.length - 6).toUpperCase()}&accountName=${encodeURIComponent(restaurantConfig.ThongTinNganHang.AccountName || "")}`}
                  alt="VietQR"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 text-red-500 text-sm font-semibold text-center px-4">
                  <span>⚠️ Chưa cài đặt Tài khoản Ngân hàng</span>
                  <span className="text-xs text-gray-400 mt-2 font-normal">
                    Vui lòng vào mục "Cài đặt hệ thống" để thiết lập.
                  </span>
                </div>
              )}
            </div>

            <div className="w-full bg-indigo-50 rounded-xl p-4 mb-6 text-left border border-indigo-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Số tiền:</span>
                <span className="font-bold text-indigo-700 text-lg">
                  {currentOrder.TongTien.toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium whitespace-nowrap mr-2">
                  Nội dung:
                </span>
                <span className="font-semibold text-gray-800 text-right">
                  Thanh toan hoa don{" "}
                  {currentOrder._id
                    .substring(currentOrder._id.length - 6)
                    .toUpperCase()}
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => executePayment("ChuyenKhoan")}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition transform active:scale-95 text-base"
              >
                ✅ Xác nhận ĐÃ NHẬN TIỀN
              </button>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition text-base"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPOS;
