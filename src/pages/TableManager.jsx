import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

import { QRCodeSVG } from "qrcode.react";
import axiosClient from "../api/axiosClient";

const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ SoBan: "", KhuVuc: "" });
  const [editingTable, setEditingTable] = useState(null);

  const printRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTables, resConfig] = await Promise.all([
        axiosClient.get("/tables"),
        axiosClient.get("/restaurant"),
      ]);

      const tablesData = resTables.data || resTables || [];
      setTables(Array.isArray(tablesData) ? tablesData : []);

      const configData = resConfig.data || resConfig || {};
      const dsKhuVuc = configData.DanhSachKhuVuc || ["Tầng 1"];
      setAreas(dsKhuVuc);

      setNewTable((prev) => ({ ...prev, KhuVuc: prev.KhuVuc || dsKhuVuc[0] }));
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu bàn. Vui lòng kiểm tra Backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingTable(null);
    setNewTable({ SoBan: "", KhuVuc: areas.length > 0 ? areas[0] : "Tầng 1" });
    setIsModalOpen(true);
  };

  const openEditModal = (table) => {
    if (table.TrangThai !== "Trống") {
      toast.warning("Chỉ có thể sửa thông tin khi bàn đang TRỐNG.");
      return;
    }
    setEditingTable(table);
    setNewTable({ SoBan: table.SoBan, KhuVuc: table.KhuVuc });
    setIsModalOpen(true);
  };

  const handleSubmitTable = async (e) => {
    e.preventDefault();
    if (!newTable.SoBan.trim()) return toast.warning("Vui lòng nhập số bàn");
    try {
      if (editingTable) {
        await axiosClient.put(`/tables/${editingTable._id}`, newTable);
        toast.success(`Đã cập nhật thông tin thành ${newTable.SoBan}!`);
      } else {
        await axiosClient.post("/tables", newTable);
        toast.success(`Tạo ${newTable.SoBan} thành công!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu bàn");
    }
  };

  const handlePrintQR = (table) => {
    if (!table.MaQR) {
      toast.error("Không tìm thấy mã QR để in.");
      return;
    }

    const printWindow = window.open("", "_blank");

    // Lấy thẻ SVG của QR Code đang hiển thị trên DOM
    const svgElement =
      document.getElementById(`qr-${table._id}`) ||
      document.getElementById(`qr-${table.MaQR.split("=").pop()}`);

    if (!svgElement) {
      toast.error("Vui lòng chờ QR render xong rồi mới in.");
      return;
    }

    // Chuyển đổi thẻ SVG thành chuỗi HTML để truyền vào popup in
    const svgString = new XMLSerializer().serializeToString(svgElement);

    const html = `
      <html>
        <head>
          <title>In QR - ${table.SoBan}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
            .ticket { border: 3px dashed #333; padding: 40px 60px; border-radius: 24px; text-align: center; }
            h1 { margin: 0 0 5px 0; font-size: 48px; color: #111; }
            p { margin: 0 0 30px 0; font-size: 24px; color: #555; font-weight: bold; }
            .qr-container { padding: 20px; background: white; border-radius: 16px; border: 2px solid #eaeaea; display: inline-block; }
            .instruction { margin-top: 25px; font-size: 18px; font-weight: bold; color: #0068ff; }
            .sub-instruction { margin-top: 5px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1>${table.SoBan}</h1>
            <p>${table.KhuVuc}</p>
            <div class="qr-container">${svgString}</div>
            <div class="instruction">QUÉT MÃ ZALO ĐỂ GỌI MÓN TẠI NHÀ HÀNG PASTA</div>
            <div class="sub-instruction">Không cần tải App - Chạm là Order</div>
          </div>
          <script>
            // Tự động gọi lệnh in sau khi mở tab
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ----------------------------------------------------------------
  // GOM NHÓM BÀN THEO KHU VỰC VÀ HIỂN THỊ MÀU SẮC TRẠNG THÁI
  // ----------------------------------------------------------------
  const groupedTables = tables.reduce((groups, table) => {
    const khuVuc = table.KhuVuc || "Khu vực khác";
    if (!groups[khuVuc]) groups[khuVuc] = [];
    groups[khuVuc].push(table);
    return groups;
  }, {});

  // Hàm lấy màu sắc theo trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Trống":
        return "bg-green-500"; // Xanh
      case "Có Khách":
        return "bg-red-500"; // Đỏ
      case "Chờ thanh toán":
        return "bg-yellow-400"; // Vàng
      default:
        return "bg-gray-400";
    }
  };

  // Hàm lấy tên hiển thị trạng thái tiếng Việt
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

  return (
    <div className="space-y-6">
      {/* <div className="max-w-6xl mx-auto font-sans pb-10"> */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản Lý Danh Sách Bàn
          </h1>
          <p className="text-gray-500 mt-1">
            Tạo bàn và in mã QR Code để khách quét gọi món
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="text-xl">+</span> Thêm Bàn Mới
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 text-blue-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="font-medium">Đang tải danh sách bàn...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
          <span className="text-6xl mb-4 opacity-50 block">🪑</span>
          <h3 className="text-xl font-bold text-gray-700">
            Chưa có bàn nào được tạo
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Hãy tạo bàn mới để hệ thống tự động sinh mã QR Zalo cho bạn nhé.
          </p>
          <button
            onClick={openAddModal}
            className="bg-blue-50 text-blue-600 font-bold px-6 py-2 rounded-lg"
          >
            Tạo bàn đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedTables).map(([khuVuc, tablesInZone]) => (
            <div
              key={khuVuc}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              {/* Tiêu đề khu vực */}
              <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-blue-50 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                {khuVuc.toUpperCase()}
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2">
                  {tablesInZone.length} bàn
                </span>
              </h3>

              {/* Danh sách bàn trong khu vực đó */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {tablesInZone.map((table) => (
                  <div
                    key={table._id}
                    className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition"
                  >
                    <div className="bg-white p-3 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800">
                        {table.SoBan}
                      </h3>
                      <span
                        className={`w-3.5 h-3.5 rounded-full shadow-inner ${getStatusColor(table.TrangThai)} cursor-help`}
                        title={`Trạng thái: ${getStatusLabel(table.TrangThai)}`}
                      ></span>
                    </div>

                    <div className="p-5 flex flex-col items-center justify-center flex-1 bg-white">
                      {table.MaQR ? (
                        <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm mb-3">
                          <QRCodeSVG
                            id={`qr-${table._id}`}
                            value={table.MaQR}
                            size={130}
                          />
                        </div>
                      ) : (
                        <div className="w-[130px] h-[130px] bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-xs text-gray-400 text-center p-2 border border-dashed">
                          Lỗi: Không có Link
                        </div>
                      )}
                      <p
                        className="text-[10px] text-gray-400 text-center break-all w-full px-2 line-clamp-1"
                        title={table.MaQR}
                      >
                        {table.MaQR || "---"}
                      </p>
                    </div>

                    <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex justify-between gap-2">
                      <button
                        onClick={() => handlePrintQR(table)}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>🖨️</span> In mã QR
                      </button>
                      <button
                        onClick={() => openEditModal(table)}
                        className="bg-white border border-gray-200 text-indigo-600 px-3 py-2 rounded-lg text-sm hover:bg-indigo-50 hover:border-indigo-100 transition"
                        title="Sửa thông tin bàn"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa Bàn */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTable ? "Sửa thông tin bàn" : "Tạo bàn mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tên Bàn
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={newTable.SoBan}
                  onChange={(e) =>
                    setNewTable({ ...newTable, SoBan: e.target.value })
                  }
                  placeholder="VD: Bàn 01, VIP 1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Khu vực
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={newTable.KhuVuc}
                  onChange={(e) =>
                    setNewTable({ ...newTable, KhuVuc: e.target.value })
                  }
                >
                  {areas.length > 0 ? (
                    areas.map((a, i) => (
                      <option key={i} value={a}>
                        {a}
                      </option>
                    ))
                  ) : (
                    <option value="Tầng 1">Tầng 1</option>
                  )}
                </select>
                {!editingTable && (
                  <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded text-blue-700 border border-blue-100">
                    ℹ️ Mã QR tích hợp Zalo App cho bàn này sẽ được sinh tự động
                    ngay sau khi tạo.
                  </p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition transform active:scale-95"
                >
                  {editingTable ? "Lưu thay đổi" : "Tạo Bàn & Sinh QR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;
