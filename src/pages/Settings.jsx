import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosClient from "../api/axiosClient";

// --- THƯ VIỆN BẢN ĐỒ ---
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix lỗi hiển thị icon mặc định của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component con để xử lý sự kiện click trên bản đồ và bay đến vị trí mới
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  // Bắt sự kiện click trên bản đồ
  useMapEvents({
    click(e) {
      setPosition({ Lat: e.latlng.lat, Lng: e.latlng.lng });
    },
  });

  // Tự động di chuyển bản đồ (flyTo) khi tọa độ position thay đổi từ bên ngoài (ví dụ bấm nút Tìm kiếm)
  useEffect(() => {
    if (position && position.Lat !== 0 && position.Lng !== 0) {
      map.flyTo([position.Lat, position.Lng], map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return position && position.Lat !== 0 ? (
    <Marker position={[position.Lat, position.Lng]}></Marker>
  ) : null;
};
// --- KẾT THÚC CẤU HÌNH BẢN ĐỒ ---

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeType, setCloseType] = useState("30p"); // '30p', '1h', 'Today', 'Manual'
  const [formData, setFormData] = useState({
    TenNhaHang: "",
    DiaChi: "",
    ToaDo: { Lat: 21.028511, Lng: 105.854165 }, // Mặc định Hà Nội
    CauHinh: {
      WifiPassword: "",
      BanKinhChoPhep: "",
      GioMoCua: "",
      GioDongCua: "",
      PhanTramVAT: "",
    },
    ThongTinNganHang: { BankId: "", AccountNo: "", AccountName: "" },
    DanhSachKhuVuc: [],
    DanhSachLoaiMon: [],
  });

  // Tải dữ liệu cài đặt từ server
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get("/restaurant");
        const data = res.data?.data || res.data || res;

        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            ToaDo: data.ToaDo || prev.ToaDo,
            CauHinh: { ...prev.CauHinh, ...data.CauHinh },
            ThongTinNganHang: {
              ...prev.ThongTinNganHang,
              ...data.ThongTinNganHang,
            },
            DanhSachKhuVuc: data.DanhSachKhuVuc || prev.DanhSachKhuVuc,
            DanhSachLoaiMon: data.DanhSachLoaiMon || prev.DanhSachLoaiMon,
          }));
        }
      } catch (error) {
        toast.error("Không thể tải cấu hình hệ thống");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Gọi API OpenStreetMap  để dịch từ Địa chỉ -> Tọa độ
  const handleSearchLocation = async () => {
    if (!formData.DiaChi.trim()) {
      toast.warning("Vui lòng nhập địa chỉ trước khi tìm kiếm!");
      return;
    }
    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.DiaChi)}`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setFormData((prev) => ({ ...prev, ToaDo: { Lat: lat, Lng: lng } }));
        toast.success("Đã tìm thấy vị trí trên bản đồ!");
      } else {
        toast.error(
          "Không tìm thấy tọa độ tự động. Bạn hãy click trực tiếp lên bản đồ nhé.",
        );
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm tọa độ.");
    } finally {
      setSearchingLocation(false);
    }
  };

  // Cập nhật tọa độ khi click trên bản đồ
  const setMapPosition = (newPos) => {
    setFormData((prev) => ({ ...prev, ToaDo: newPos }));
  };

  // Xử lý Thêm / Xóa khu vực
  const handleAddArea = (e) => {
    e.preventDefault();
    if (newAreaInput.trim() !== "") {
      if (formData.DanhSachKhuVuc.includes(newAreaInput.trim())) {
        toast.warning("Khu vực này đã tồn tại!");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        DanhSachKhuVuc: [...prev.DanhSachKhuVuc, newAreaInput.trim()],
      }));
      setNewAreaInput("");
    }
  };

  const handleRemoveArea = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      DanhSachKhuVuc: prev.DanhSachKhuVuc.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };
  // Xử lý Thêm / Xóa LOẠI MÓN
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategoryInput.trim() !== "") {
      if (formData.DanhSachLoaiMon.includes(newCategoryInput.trim()))
        return toast.warning("Loại món này đã tồn tại!");
      setFormData((prev) => ({
        ...prev,
        DanhSachLoaiMon: [...prev.DanhSachLoaiMon, newCategoryInput.trim()],
      }));
      setNewCategoryInput("");
    }
  };
  const handleRemoveCategory = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      DanhSachLoaiMon: prev.DanhSachLoaiMon.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };
  // --- LOGIC ĐÓNG/MỞ CỬA LINH HOẠT ---
  const handleToggleStatus = () => {
    if (formData.TrangThaiHoatDong) {
      // Nếu đang Mở -> Muốn Đóng -> Mở Modal chọn kiểu đóng
      setIsCloseModalOpen(true);
    } else {
      // Nếu đang Đóng -> Muốn Mở lại ngay
      executeToggleStatus(true, null);
    }
  };

  const executeToggleStatus = async (status, type) => {
    try {
      const payload = { TrangThaiHoatDong: status, KieuDongCua: type };
      await axiosClient.put("/restaurant", payload);

      setFormData((prev) => ({ ...prev, TrangThaiHoatDong: status }));
      setIsCloseModalOpen(false);

      const msg = status
        ? "🟢 Nhà hàng đã MỞ CỬA trở lại!"
        : "🔴 Nhà hàng đã TẠM ĐÓNG CỬA!";
      toast.success(msg);
    } catch (e) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Lưu cấu hình
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosClient.put("/restaurant", formData);
      toast.success("Đã lưu cấu hình hệ thống!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>
    );

  return (
    <div className="space-y-6">
      {/* <div className="max-w-5xl mx-auto font-sans pb-10"> */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt Hệ thống</h1>
          <p className="text-gray-500 mt-1">
            Quản lý các tham số vận hành của nhà hàng
          </p>
        </div>
        {/* TRẠNG THÁI HOẠT ĐỘNG CHÍNH */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Trạng thái hiện tại
            </p>
            <p
              className={`font-black ${formData.TrangThaiHoatDong ? "text-emerald-500" : "text-rose-500"}`}
            >
              {formData.TrangThaiHoatDong ? "ĐANG MỞ CỬA" : "ĐÃ ĐÓNG CỬA"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`relative inline-flex h-10 w-18 items-center rounded-full transition-all duration-500 ${
              formData.TrangThaiHoatDong ? "bg-emerald-500" : "bg-rose-500"
            }`}
            style={{ width: "70px" }}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-500 ${
                formData.TrangThaiHoatDong ? "translate-x-9" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BLOCK 1: THÔNG TIN CHUNG & BẢN ĐỒ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-orange-500">
          <h2 className="text-xl font-bold text-gray-800 mb-5 border-b pb-3">
            1. Thông tin & Vị trí nhà hàng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên nhà hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.TenNhaHang}
                onChange={(e) =>
                  setFormData({ ...formData, TenNhaHang: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mật khẩu Wifi
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.CauHinh.WifiPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    CauHinh: {
                      ...formData.CauHinh,
                      WifiPassword: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.DiaChi}
                  onChange={(e) =>
                    setFormData({ ...formData, DiaChi: e.target.value })
                  }
                  required
                  placeholder="Ví dụ: 141 Chiến Thắng, Thanh Trì, Hà Nội"
                />
                <button
                  type="button"
                  onClick={handleSearchLocation}
                  disabled={searchingLocation}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold border border-gray-300 transition flex items-center gap-2"
                >
                  {searchingLocation ? "⏳ Đang tìm..." : "🔍 Tìm tọa độ"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Nhập địa chỉ rồi bấm "Tìm tọa độ", hoặc click trực tiếp trên bản
                đồ bên dưới để ghim vị trí chính xác.
              </p>
            </div>
          </div>

          {/* Bản đồ chọn tọa độ */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                  value={formData.ToaDo.Lat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ToaDo: {
                        ...formData.ToaDo,
                        Lat: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                  value={formData.ToaDo.Lng}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ToaDo: {
                        ...formData.ToaDo,
                        Lng: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Bán kính cho phép mở bàn (mét)
                </label>
                <input
                  type="number"
                  className="w-full border border-blue-300 bg-blue-50 text-blue-800 rounded-lg p-2 text-sm font-bold outline-none"
                  value={formData.CauHinh.BanKinhChoPhep}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      CauHinh: {
                        ...formData.CauHinh,
                        BanKinhChoPhep: Number(e.target.value),
                      },
                    })
                  }
                  title="Khoảng cách tối đa khách được phép đặt món"
                />
              </div>
            </div>

            <div className="w-full h-[350px] rounded-xl overflow-hidden border border-gray-300 shadow-inner z-0">
              <MapContainer
                center={[
                  formData.ToaDo.Lat || 21.028511,
                  formData.ToaDo.Lng || 105.854165,
                ]}
                zoom={16}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={formData.ToaDo}
                  setPosition={setMapPosition}
                />
              </MapContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Giờ mở cửa
              </label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.CauHinh.GioMoCua}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    CauHinh: { ...formData.CauHinh, GioMoCua: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Giờ đóng cửa
              </label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.CauHinh.GioDongCua}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    CauHinh: {
                      ...formData.CauHinh,
                      GioDongCua: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phần trăm VAT (%)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.CauHinh.PhanTramVAT}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    CauHinh: {
                      ...formData.CauHinh,
                      PhanTramVAT: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* BLOCK 2: TÀI KHOẢN NGÂN HÀNG (VIETQR) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-center mb-5 border-b pb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                2. Tài khoản Nhận tiền (VietQR)
                <span className="p-2 bg-white/10 rounded-xl text-indigo-300">
                  🏧
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Hệ thống sẽ tự động tạo mã QR quét thanh toán dựa trên thông tin
                này
              </p>
            </div>
            <span className="text-4xl">🏦</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ngân hàng
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                value={formData.ThongTinNganHang.BankId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ThongTinNganHang: {
                      ...formData.ThongTinNganHang,
                      BankId: e.target.value.toUpperCase(),
                    },
                  })
                }
                placeholder="VD: MB, VCB, TCB, BIDV..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Số tài khoản
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.ThongTinNganHang.AccountNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ThongTinNganHang: {
                      ...formData.ThongTinNganHang,
                      AccountNo: e.target.value,
                    },
                  })
                }
                placeholder="Nhập chính xác STK"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                value={formData.ThongTinNganHang.AccountName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ThongTinNganHang: {
                      ...formData.ThongTinNganHang,
                      AccountName: e.target.value.toUpperCase(),
                    },
                  })
                }
                placeholder="VD: NGUYEN VAN A"
              />
            </div>
          </div>
        </div>

        {/* BLOCK 3: QUẢN LÝ KHU VỰC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QUẢN LÝ KHU VỰC */}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  3. Danh sách Khu vực Bàn
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Dùng để phân loại khi tạo bàn mới và hiển thị trên màn hình
                  POS
                </p>
              </div>
              <span className="text-4xl">🗺️</span>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                placeholder="Nhập tên khu vực mới"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddArea(e);
                }}
              />
              <button
                onClick={handleAddArea}
                type="button"
                className="bg-emerald-600 text-white px-6 rounded-xl font-bold shadow hover:bg-emerald-700 transition"
              >
                Thêm khu vực
              </button>
            </div>

            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl min-h-[80px]">
              {formData.DanhSachKhuVuc.map((khuVuc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm"
                >
                  <span className="font-semibold text-gray-700">{khuVuc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(index)}
                    className="text-red-400 hover:text-red-600 font-bold ml-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {formData.DanhSachKhuVuc.length === 0 && (
                <span className="text-gray-400 italic flex items-center">
                  Chưa có khu vực nào. Hãy thêm ở trên!
                </span>
              )}
            </div>
          </div>
          {/* QUẢN LÝ LOẠI MÓN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-amber-500">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              4. Danh mục Phân loại món
            </h2>
            <p className="text-xs text-gray-500 mb-4 pb-3 border-b">
              Hiển thị trong Menu để khách dễ chọn
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Thêm loại món "
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory(e);
                }}
              />
              <button
                onClick={handleAddCategory}
                type="button"
                className="bg-amber-500 text-white px-4 rounded-xl font-bold hover:bg-amber-600 transition text-sm"
              >
                Thêm
              </button>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl min-h-[80px]">
              {formData.DanhSachLoaiMon.map((loai, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm text-sm"
                >
                  <span className="font-semibold text-gray-700">{loai}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-red-400 hover:text-red-600 font-bold ml-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3.5 text-white rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {saving ? "Đang lưu..." : "💾 Lưu toàn bộ Cài đặt"}
          </button>
        </div>
      </form>

      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">
                🛑
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                Xác nhận đóng cửa?
              </h3>
              <p className="text-gray-500 text-sm mb-8">
                Hệ thống sẽ từ chối tất cả các yêu cầu gọi món mới từ khách hàng
                Zalo.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { id: "30p", label: "30 Phút", icon: "⏱️" },
                  { id: "1h", label: "1 Giờ", icon: "⏳" },
                  { id: "Today", label: "Hết hôm nay", icon: "📅" },
                  { id: "Manual", label: "Thủ công", icon: "🔒" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setCloseType(option.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      closeType === option.id
                        ? "border-rose-500 bg-rose-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl mb-1">{option.icon}</span>
                    <span
                      className={`text-xs font-black ${closeType === option.id ? "text-rose-700" : "text-gray-500"}`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => executeToggleStatus(false, closeType)}
                  className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black shadow-lg shadow-rose-200 hover:bg-rose-600 transition"
                >
                  Xác nhận đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
