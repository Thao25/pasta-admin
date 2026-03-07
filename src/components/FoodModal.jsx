import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import axiosClient from "../api/axiosClient";

const FoodModal = ({
  isOpen,
  onClose,
  foodToEdit,
  refreshData,
  categories = [],
}) => {
  const initialForm = {
    TenMon: { vi: "", en: "" },
    MoTa: { vi: "", en: "" },
    Gia: "",
    LoaiMon: categories.length > 0 ? categories[0] : "Khác",
    AnhMinhHoa: "",
    TrangThai: "DangBan",
    KhuVucCheBien: "Bep",
    Tags: "",
    TuyChon: [],
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (foodToEdit) {
      setFormData({
        ...foodToEdit,
        Tags: foodToEdit.Tags ? foodToEdit.Tags.join(", ") : "",
        TuyChon: foodToEdit.TuyChon || [],
        LoaiMon:
          foodToEdit.LoaiMon ||
          (categories.length > 0 ? categories[0] : "Khác"),
      });
    } else {
      setFormData({
        ...initialForm,
        LoaiMon: categories.length > 0 ? categories[0] : "Khác",
      });
    }
  }, [foodToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Cấu hình Tùy chọn (Size/Topping)
  const handleAddOptionGroup = () => {
    setFormData((prev) => ({
      ...prev,
      TuyChon: [
        ...prev.TuyChon,
        { TenNhom: { vi: "", en: "" }, BatBuoc: false, LuaChon: [] },
      ],
    }));
  };
  const handleUpdateOptionGroup = (gIdx, field, value) => {
    const newTuyChon = [...formData.TuyChon];
    if (field === "vi" || field === "en")
      newTuyChon[gIdx].TenNhom[field] = value;
    else newTuyChon[gIdx][field] = value;
    setFormData({ ...formData, TuyChon: newTuyChon });
  };
  const handleRemoveOptionGroup = (gIdx) => {
    setFormData({
      ...formData,
      TuyChon: formData.TuyChon.filter((_, idx) => idx !== gIdx),
    });
  };
  const handleAddOptionItem = (gIdx) => {
    const newTuyChon = [...formData.TuyChon];
    newTuyChon[gIdx].LuaChon.push({ Ten: "", GiaThem: 0 });
    setFormData({ ...formData, TuyChon: newTuyChon });
  };
  const handleUpdateOptionItem = (gIdx, oIdx, field, value) => {
    const newTuyChon = [...formData.TuyChon];
    newTuyChon[gIdx].LuaChon[oIdx][field] = value;
    setFormData({ ...formData, TuyChon: newTuyChon });
  };
  const handleRemoveOptionItem = (gIdx, oIdx) => {
    const newTuyChon = [...formData.TuyChon];
    newTuyChon[gIdx].LuaChon = newTuyChon[gIdx].LuaChon.filter(
      (_, idx) => idx !== oIdx,
    );
    setFormData({ ...formData, TuyChon: newTuyChon });
  };

  // Upload Ảnh từ máy tính
  const handleUploadLocalFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const body = new FormData();
    body.append("image", file);
    setUploading(true);

    try {
      // Gửi file nhị phân qua form-data thay vì dán URL
      const res = await axiosClient.post("/upload", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Trả về /uploads/image-123.jpg, nối thêm domain nếu cần
      const baseUrl = axiosClient.defaults.baseURL.replace("/api", "");
      setFormData({ ...formData, AnhMinhHoa: `${baseUrl}${res}` });
      toast.success("Đã tải ảnh lên thành công!");
    } catch (err) {
      toast.error("Lỗi khi tải ảnh lên server.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = {
      ...formData,
      Tags:
        typeof formData.Tags === "string"
          ? formData.Tags.split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag !== "")
          : [],
    };

    try {
      if (foodToEdit) {
        await axiosClient.put(`/foods/${foodToEdit._id}`, dataToSend);
        toast.success("Cập nhật món thành công!");
      } else {
        await axiosClient.post("/foods", dataToSend);
        toast.success("Thêm món mới thành công!");
      }
      refreshData();
      onClose();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu món");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        <div className="sticky top-0 bg-white z-10 p-5 border-b flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            {foodToEdit ? "✏️ Chỉnh Sửa Món Ăn" : "✨ Thêm Món Mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl font-bold transition"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên món (Tiếng Việt) <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={formData.TenMon.vi}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    TenMon: { ...formData.TenMon, vi: e.target.value },
                  })
                }
                placeholder="VD: Trà sữa nướng"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên món (Tiếng Anh) <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={formData.TenMon.en}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    TenMon: { ...formData.TenMon, en: e.target.value },
                  })
                }
                placeholder="E.g: Roasted Milk Tea"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mô tả (Tiếng Việt) <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={formData.MoTa.vi}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    MoTa: { ...formData.MoTa, vi: e.target.value },
                  })
                }
                placeholder="VD: Trà sữa được nướng trên lửa than, thơm ngon khó cưỡng"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mô tả (Tiếng Anh) <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={formData.MoTa.en}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    MoTa: { ...formData.MoTa, en: e.target.value },
                  })
                }
                placeholder="E.g: Milk tea roasted over charcoal fire, irresistibly delicious"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Giá bán (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={formData.Gia}
                onChange={(e) =>
                  setFormData({ ...formData, Gia: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Loại Món
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                  value={formData.LoaiMon}
                  onChange={(e) =>
                    setFormData({ ...formData, LoaiMon: e.target.value })
                  }
                >
                  {categories.length > 0 ? (
                    categories.map((cat, i) => (
                      <option key={i} value={cat}>
                        {cat}
                      </option>
                    ))
                  ) : (
                    <option value="Khác">Khác</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nơi chế biến
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-400 transition bg-orange-50 text-orange-800 font-bold"
                  value={formData.KhuVucCheBien}
                  onChange={(e) =>
                    setFormData({ ...formData, KhuVucCheBien: e.target.value })
                  }
                >
                  <option value="Bep">🍳 Bếp (Nhà bếp)</option>
                  <option value="Bar">🍹 Bar (Pha chế)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload Ảnh từ máy */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Hình ảnh Món ăn (Từ máy tính)
            </label>
            <div className="flex items-center gap-6">
              <label className="cursor-pointer border-2 border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl p-6 text-center transition flex-1 flex flex-col items-center">
                <span className="text-3xl mb-2">🖼️</span>
                <span className="font-semibold text-sm">
                  Click để chọn ảnh từ máy
                </span>
                <span className="text-xs text-blue-500 mt-1">
                  PNG, JPG, JPEG (Max 5MB)
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadLocalFile}
                />
              </label>

              <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : formData.AnhMinhHoa ? (
                  <img
                    src={formData.AnhMinhHoa}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    Chưa có ảnh
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-900">
                  Cấu hình Tùy chọn (Size / Topping)
                </h3>
                <p className="text-xs text-indigo-500 mt-1">
                  Giúp khách hàng chọn size đá/đường, thêm topping dễ dàng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOptionGroup}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
              >
                + Thêm Nhóm
              </button>
            </div>

            {formData.TuyChon.length === 0 ? (
              <div className="text-center py-6 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-xl">
                Không có tùy chọn nào. Bấm nút Thêm Nhóm để tạo mới.
              </div>
            ) : (
              <div className="space-y-5">
                {formData.TuyChon.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionGroup(gIdx)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-600 font-bold bg-white px-2 py-1 rounded-lg border border-red-100 shadow-sm transition"
                    >
                      Xóa nhóm
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 pr-24">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          Tên nhóm (VI)
                        </label>
                        <input
                          placeholder="VD: Kích cỡ, Đá..."
                          className="border p-2 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-400"
                          value={group.TenNhom.vi}
                          onChange={(e) =>
                            handleUpdateOptionGroup(gIdx, "vi", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          Tên nhóm (EN)
                        </label>
                        <input
                          placeholder="VD: Size, Ice..."
                          className="border p-2 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-400"
                          value={group.TenNhom.en}
                          onChange={(e) =>
                            handleUpdateOptionGroup(gIdx, "en", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center text-sm font-semibold text-gray-700 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full">
                          <input
                            type="checkbox"
                            className="mr-2 w-4 h-4 text-indigo-600 rounded border-gray-300"
                            checked={group.BatBuoc}
                            onChange={(e) =>
                              handleUpdateOptionGroup(
                                gIdx,
                                "BatBuoc",
                                e.target.checked,
                              )
                            }
                          />
                          Bắt buộc chọn
                        </label>
                      </div>
                    </div>

                    <div className="pl-4 border-l-2 border-indigo-300 space-y-2">
                      {group.LuaChon.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            placeholder="Tên lựa chọn (VD: Trân châu trắng)"
                            className="border p-2 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                            value={opt.Ten}
                            onChange={(e) =>
                              handleUpdateOptionItem(
                                gIdx,
                                oIdx,
                                "Ten",
                                e.target.value,
                              )
                            }
                            required
                          />
                          <div className="flex items-center gap-2 bg-white border rounded-lg px-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
                            <span className="text-sm font-bold text-gray-400">
                              +
                            </span>
                            <input
                              type="number"
                              placeholder="Giá cộng thêm"
                              className="p-2 text-sm w-28 outline-none font-bold text-blue-700"
                              value={opt.GiaThem}
                              onChange={(e) =>
                                handleUpdateOptionItem(
                                  gIdx,
                                  oIdx,
                                  "GiaThem",
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="text-sm font-bold text-gray-400">
                              đ
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionItem(gIdx, oIdx)}
                            className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition"
                            title="Xóa lựa chọn này"
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddOptionItem(gIdx)}
                        className="text-sm text-indigo-600 font-bold mt-2 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition shadow-sm"
                      >
                        + Thêm Lựa chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tags (Từ khóa cho AI gợi ý)
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.Tags}
              onChange={(e) =>
                setFormData({ ...formData, Tags: e.target.value })
              }
              placeholder="VD: cay, nong, an-sang..."
            />
          </div>

          <div className="pt-5 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className={`px-8 py-3 text-white rounded-xl font-bold shadow-md transition transform active:scale-95 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading
                ? "Đang lưu..."
                : foodToEdit
                  ? "💾 Cập nhật Món"
                  : "✨ Thêm Mới Món"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodModal;
