import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import FoodModal from "../components/FoodModal";
import axiosClient from "../api/axiosClient";

const MenuManager = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // Gọi 2 API: Lấy list thức ăn và cấu hình danh mục
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resFoods, resConfig] = await Promise.all([
        axiosClient.get("/foods"),
        axiosClient.get("/restaurant"),
      ]);
      setFoods(resFoods.data?.data || resFoods.data || []);

      const conf = resConfig.data?.data || resConfig.data || {};
      setCategories(conf.DanhSachLoaiMon || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu Menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn (xóa) món này không?")) {
      try {
        await axiosClient.delete(`/foods/${id}`);
        toast.success("Đã ngưng bán món ăn");
        fetchData();
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axiosClient.put(`/foods/${id}/status`, { TrangThai: newStatus });
      toast.success("Cập nhật trạng thái thành công!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const openAddModal = () => {
    setSelectedFood(null);
    setModalOpen(true);
  };

  const openEditModal = (food) => {
    setSelectedFood(food);
    setModalOpen(true);
  };

  // Phân chia theo Khu Vực (Bếp/Bar)
  const kitchenFoods = foods.filter((f) => f.KhuVucCheBien === "Bep");
  const barFoods = foods.filter((f) => f.KhuVucCheBien === "Bar");

  // Giao diện render thẻ món ăn
  const renderFoodCard = (food) => {
    const isDangBan = food.TrangThai === "DangBan";
    const isHetHang = food.TrangThai === "HetHang";

    return (
      <div
        key={food._id}
        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row items-center justify-between gap-4"
      >
        {/* Khối 1: Ảnh + Thông tin */}
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative w-16 h-16 shrink-0">
            <img
              src={food.AnhMinhHoa}
              alt={food.TenMon.vi}
              className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                e.target.src = "https://placehold.co/100x100?text=No+Image";
              }}
            />
          </div>
          <div className="flex flex-col flex-1">
            <h4 className="text-base font-extrabold text-gray-800 leading-tight mb-1 line-clamp-1">
              {food.TenMon.vi}
            </h4>
            <p className="text-xs font-medium text-gray-500 italic mb-1 line-clamp-1">
              {food.TenMon.en}
            </p>
            {food.TuyChon && food.TuyChon.length > 0 && (
              <span className="bg-indigo-50 text-indigo-700 w-max border border-indigo-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ⚙️ {food.TuyChon.length} Tùy chọn
              </span>
            )}
          </div>
        </div>

        {/* Khối 2: Giá tiền */}
        <div className="w-full lg:w-32 flex justify-start lg:justify-center">
          <div className="bg-blue-50 text-blue-700 font-black px-3 py-1.5 rounded-lg border border-blue-100 w-full text-center">
            {food.Gia.toLocaleString()} đ
          </div>
        </div>

        {/* Khối 3: Đổi Trạng thái (Dropdown) */}
        <div className="w-full lg:w-40 flex justify-start lg:justify-center">
          <select
            value={food.TrangThai}
            onChange={(e) => handleUpdateStatus(food._id, e.target.value)}
            className={`w-full text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer border shadow-sm transition-colors
              ${
                isDangBan
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-2 focus:ring-emerald-400"
                  : isHetHang
                    ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-2 focus:ring-rose-400"
                    : "bg-amber-50 text-amber-700 border-amber-200 focus:ring-2 focus:ring-amber-400"
              }
            `}
          >
            <option value="DangBan" className="text-gray-800 bg-white">
              ✅ Đang bán
            </option>
            <option value="HetHang" className="text-gray-800 bg-white">
              ❌ Hết hàng
            </option>
            <option value="TamNgung" className="text-gray-800 bg-white">
              ⏸️ Tạm ngưng
            </option>
          </select>
        </div>

        {/* Khối 4: Nút Sửa / Xóa */}
        <div className="w-full lg:w-auto flex justify-end gap-2 shrink-0">
          <button
            onClick={() => openEditModal(food)}
            className="flex-1 lg:flex-none text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 px-4 py-1.5 rounded-lg transition font-bold text-sm shadow-sm"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDelete(food._id)}
            className="flex-1 lg:flex-none text-rose-500 bg-white border border-rose-200 hover:bg-rose-50 px-4 py-1.5 rounded-lg transition font-bold text-sm shadow-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    );
  };

  // Render Danh sách món ăn gom nhóm theo Loại món (Category)
  const renderFoodGroupsByCategory = (foodList, areaName) => {
    if (foodList.length === 0) {
      return (
        <p className="text-center italic text-gray-400 py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          Chưa có món nào thuộc {areaName}.
        </p>
      );
    }

    // Gom nhóm các món theo LoaiMon
    const grouped = foodList.reduce((acc, food) => {
      const cat = food.LoaiMon || "Khác";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(food);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([catName, items]) => (
          <div
            key={catName}
            className="bg-white/60 p-4 rounded-xl border border-gray-200"
          >
            <h4 className="text-base font-bold text-gray-700 mb-3 px-3 py-1 bg-gray-100/80 rounded-lg border-l-4 border-gray-400 inline-block shadow-sm">
              🏷️ {catName} ({items.length})
            </h4>
            <div className="flex flex-col gap-2.5">
              {items.map(renderFoodCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto font-sans pb-10">
      <div className="flex justify-between items-center mb-8 border-b pb-5 border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">
            Quản Lý Thực Đơn
          </h1>
          <p className="text-gray-500 mt-1">
            Phân loại món theo Khu vực (Bếp/Bar) và Loại món động
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg transition transform active:scale-95"
        >
          <span className="text-xl">+</span> Thêm món mới
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-blue-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="font-semibold text-gray-500">Đang tải thực đơn...</p>
        </div>
      ) : foods.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
          <span className="text-6xl mb-4 opacity-50 block">🍽️</span>
          <h3 className="text-xl font-bold text-gray-700">
            Chưa có món ăn nào
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Hãy bấm nút thêm mới để thiết lập danh mục món ăn cho nhà hàng của
            bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ================= KHU VỰC BẾP ================= */}
          <section className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100 shadow-sm">
            <div className="flex items-center justify-between mb-5 bg-orange-100 border border-orange-200 px-5 py-3 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl drop-shadow-sm">🍳</span>
                <h2 className="text-xl font-black text-orange-800 uppercase tracking-wide">
                  Khu Vực Bếp
                </h2>
              </div>
              <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {kitchenFoods.length} món
              </span>
            </div>
            {renderFoodGroupsByCategory(kitchenFoods, "Khu Vực Bếp")}
          </section>

          {/* ================= KHU VỰC BAR ================= */}
          <section className="bg-cyan-50/30 p-5 rounded-2xl border border-cyan-100 shadow-sm">
            <div className="flex items-center justify-between mb-5 bg-cyan-100 border border-cyan-200 px-5 py-3 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl drop-shadow-sm">🍹</span>
                <h2 className="text-xl font-black text-cyan-800 uppercase tracking-wide">
                  Khu Vực Pha Chế (Bar)
                </h2>
              </div>
              <span className="bg-cyan-200 text-cyan-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {barFoods.length} món
              </span>
            </div>
            {renderFoodGroupsByCategory(barFoods, "Khu Vực Pha Chế")}
          </section>
        </div>
      )}

      {/* Truyền biến danh sách loại món (categories) xuống cho Modal Form */}
      <FoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        foodToEdit={selectedFood}
        refreshData={fetchData}
        categories={categories}
      />
    </div>
  );
};

export default MenuManager;
