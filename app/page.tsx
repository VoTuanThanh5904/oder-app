'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableStatus, 
  Order, 
  OrderDetail, 
  TABLE_STATUS_LABEL 
} from '@/types';
import { INITIAL_TABLES, MENU_PRODUCTS } from '@/data/mockData';

const LOCAL_STORAGE_ORDERS_KEY = 'restaurant_orders';

export default function RestaurantPage() {
  // 1. Quản lý danh sách bàn tại chỗ
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  
  // 2. Quản lý chọn nhiều bàn bằng checkbox
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<TableStatus>('AVAILABLE');

  // 3. Quản lý form tạo đơn
  const [targetTableId, setTargetTableId] = useState<string>(tables[0]?.tableId || '');
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: number }>({});
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // State xác nhận bỏ qua cảnh báo khi bàn không khả dụng
  const [forceConfirmTable, setForceConfirmTable] = useState<boolean>(false);

  // 4. Lưu trữ danh sách đơn hàng VĨNH VIỄN TRÊN MÁY (qua localStorage)
  const [orders, setOrders] = useState<Order[]>([]);

  // 5. Lưu đơn vừa tạo để chuyển sang màn hình Hóa đơn tạm tính
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // 6. Lưu đơn đang được chọn để xem "Chi tiết đơn" dạng Modal
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);

  // Đọc danh sách đơn từ localStorage khi ứng dụng khởi chạy lần đầu
  useEffect(() => {
    // Đưa vào setTimeout(..., 0) để không chặn luồng render đồng bộ của React
    const timer = setTimeout(() => {
      try {
        const savedOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
        if (savedOrders) {
          const parsed: Order[] = JSON.parse(savedOrders);
          setOrders(parsed);
          console.log('%c[LOG: ĐÃ TẢI DANH SÁCH ĐƠN HÀNG TỪ MÁY (localStorage)]', 'color: #0284c7; font-weight: bold;');
          console.log('Tổng số đơn tìm thấy:', parsed.length);
        }
      } catch (error) {
        console.error('Lỗi khi đọc đơn hàng từ localStorage:', error);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Hàm tiện ích: Lưu orders vào cả State và LocalStorage trên máy
  const saveOrdersToStorage = (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(newOrders));
    } catch (error) {
      console.error('Lỗi khi ghi đơn hàng vào localStorage:', error);
    }
  };

  // Kiểm tra bàn đang chọn
  const selectedTable = tables.find((t) => t.tableId === targetTableId);
  const isTableNotAvailable = selectedTable && selectedTable.status !== 'AVAILABLE';

  // -------------------------------------------------------------
  // XỬ LÝ 1: CẬP NHẬT TRẠNG THÁI BÀN (ĐƠN & HÀNG LOẠT)
  // -------------------------------------------------------------
  const handleToggleSelectTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTableIds(tables.map((t) => t.tableId));
    } else {
      setSelectedTableIds([]);
    }
  };

  const handleUpdateBatchStatus = () => {
    if (selectedTableIds.length === 0) {
      alert('Vui lòng tích chọn ít nhất một bàn để cập nhật!');
      return;
    }

    const updatedTables = tables.map((t) => {
      if (selectedTableIds.includes(t.tableId)) {
        return { ...t, status: batchStatus };
      }
      return t;
    });

    setTables(updatedTables);

    console.log('%c[LOG: CẬP NHẬT TRẠNG THÁI NHIỀU BÀN THÀNH CÔNG]', 'color: #10b981; font-weight: bold; font-size: 13px;');
    console.log('Danh sách mã bàn thay đổi:', selectedTableIds);
    console.log('Trạng thái mới áp dụng:', batchStatus);
    console.log('Dữ liệu bàn sau cập nhật:', updatedTables);

    setSelectedTableIds([]);
  };

  const handleUpdateSingleStatus = (tableId: string, newStatus: TableStatus) => {
    const updated = tables.map((t) => (t.tableId === tableId ? { ...t, status: newStatus } : t));
    setTables(updated);

    console.log(`%c[LOG: CẬP NHẬT TRẠNG THÁI BÀN ${tableId}]`, 'color: #3b82f6; font-weight: bold;');
    console.log(`Bàn: ${tableId} => Trạng thái mới: ${newStatus}`);
  };

  const handleSelectTargetTable = (tableId: string) => {
    setTargetTableId(tableId);
    setForceConfirmTable(false);
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  };

  // -------------------------------------------------------------
  // XỬ LÝ 2: TẠO ĐƠN CHO BÀN & LƯU VÀO MÁY (LOCALSTORAGE)
  // -------------------------------------------------------------
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTableNotAvailable && !forceConfirmTable) {
      alert(
        `⚠️ Cảnh báo nghiệp vụ: Bàn ${targetTableId} hiện đang ở trạng thái "${TABLE_STATUS_LABEL[selectedTable!.status].label}".\nVui lòng tích chọn xác nhận bên dưới nếu bạn vẫn muốn tạo đơn cho bàn này!`
      );
      return;
    }

    const orderKeys = Object.keys(selectedItems);
    if (orderKeys.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món ăn trước khi tạo đơn!');
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // Tạo danh sách Chi tiết đơn chuẩn 6 trường
    const details: OrderDetail[] = orderKeys.map((productId, index) => {
      const product = MENU_PRODUCTS.find((p) => p.id === productId)!;
      const quantity = selectedItems[productId];
      const totalPrice = product.price * quantity;

      return {
        orderDetailId: `DTL-${orderId}-${index + 1}`,
        orderId: orderId,
        productName: product.name,
        unitPrice: product.price,
        quantity: quantity,
        totalPrice: totalPrice,
      };
    });

    const totalProductPrice = details.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = Math.round((totalProductPrice * (discountPercent || 0)) / 100);
    const priceAfterDiscount = totalProductPrice - discountAmount;
    const taxAmount = Math.round(priceAfterDiscount * 0.08); // VAT 8%
    const totalOrderPrice = priceAfterDiscount + taxAmount;

    const newOrder: Order = {
      orderId,
      tableId: targetTableId,
      totalProductPrice,
      taxAmount,
      discountAmount,
      totalOrderPrice,
      status: 'SERVING',
      createdAt: new Date().toLocaleString('vi-VN'),
      details,
    };

    // 1. Lưu đơn vào State và ghi bền vững vào LocalStorage của máy
    const updatedOrders = [newOrder, ...orders];
    saveOrdersToStorage(updatedOrders);

    // 2. Chuyển bàn sang "Đang được sử dụng"
    setTables((prev) =>
      prev.map((t) => (t.tableId === targetTableId ? { ...t, status: 'OCCUPIED' } : t))
    );

    // 3. GỌI CONSOLE.LOG THEO YÊU CẦU
    console.log('%c[LOG: ĐÃ TẠO VÀ LƯU ĐƠN VÀO MÁY THÀNH CÔNG]', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
    console.log('1. THÔNG TIN ĐƠN HÀNG (Order):', {
      orderId: newOrder.orderId,
      tableId: newOrder.tableId,
      totalProductPrice: newOrder.totalProductPrice,
      discountAmount: newOrder.discountAmount,
      taxAmount: newOrder.taxAmount,
      totalOrderPrice: newOrder.totalOrderPrice,
      status: newOrder.status,
    });
    console.log('2. DANH SÁCH CHI TIẾT ĐƠN (OrderDetail):', newOrder.details);

    // 4. Mở trang hiển thị bill tạm tính ngay lập tức
    setCurrentOrder(newOrder);
  };

  // -------------------------------------------------------------
  // XỬ LÝ 3: XÓA ĐƠN HÀNG KHỎI MÁY
  // -------------------------------------------------------------
  const handleDeleteOrder = (orderIdToDelete: string) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng "${orderIdToDelete}" khỏi máy không?`);
    if (!isConfirm) return;

    const updatedOrders = orders.filter((o) => o.orderId !== orderIdToDelete);
    saveOrdersToStorage(updatedOrders);

    // Nếu đang mở xem chi tiết của đơn bị xóa thì đóng modal lại
    if (viewingOrderDetails?.orderId === orderIdToDelete) {
      setViewingOrderDetails(null);
    }

    console.log(`%c[LOG: ĐÃ XÓA ĐƠN HÀNG ${orderIdToDelete} KHỎI MÁY]`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
    console.log('Danh sách đơn còn lại trong máy:', updatedOrders);
  };

  // -------------------------------------------------------------
  // XỬ LÝ 4: MỞ XEM CHI TIẾT ĐƠN BẤT KỲ
  // -------------------------------------------------------------
  const handleOpenOrderDetail = (order: Order) => {
    setViewingOrderDetails(order);

    console.log(`%c[LOG: XEM CHI TIẾT ĐƠN HÀNG ${order.orderId}]`, 'color: #8b5cf6; font-weight: bold; font-size: 13px;');
    console.log('Mã đơn:', order.orderId);
    console.log('Mã bàn:', order.tableId);
    console.log('Chi tiết đơn:', order.details);
  };

  // Helper trả về style & nội dung theo từng trạng thái cần cảnh báo
  const getAlertStyle = (status: TableStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return {
          container: 'bg-rose-50 border-rose-500 text-rose-900',
          title: 'text-rose-700',
          badge: 'text-rose-700',
          checkbox: 'border-rose-400 text-rose-600 focus:ring-rose-500',
          note: 'Bàn này đang có khách ngồi dùng bữa hoặc đã có đơn trước đó. Bạn có chắc chắn muốn tạo thêm đơn cho bàn này không?',
        };
      case 'MAINTENANCE':
        return {
          container: 'bg-amber-50 border-amber-500 text-amber-900',
          title: 'text-amber-700',
          badge: 'text-amber-700',
          checkbox: 'border-amber-400 text-amber-600 focus:ring-amber-500',
          note: 'Bàn này đang trong quá trình bảo trì, sửa chữa thiết bị. Bạn có chắc chắn vẫn muốn đặt bàn này không?',
        };
      case 'OUT_OF_SERVICE':
        return {
          container: 'bg-slate-100 border-slate-500 text-slate-900',
          title: 'text-slate-700',
          badge: 'text-slate-700',
          checkbox: 'border-slate-400 text-slate-600 focus:ring-slate-500',
          note: 'Bàn này hiện đã tạm ngưng sử dụng phục vụ. Bạn có chắc chắn vẫn muốn mở lại và đặt bàn này không?',
        };
      default:
        return null;
    }
  };

  // -------------------------------------------------------------
  // GIAO DIỆN HÓA ĐƠN TẠM TÍNH (SAU KHI TẠO ĐƠN THÀNH CÔNG)
  // -------------------------------------------------------------
  if (currentOrder) {
    const tableInfo = tables.find((t) => t.tableId === currentOrder.tableId);

    return (
      <main className="min-h-screen bg-slate-100 py-10 px-4 flex justify-center items-center font-sans">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">
              Tạo đơn thành công &amp; Đã lưu vào máy
            </span>
            <h1 className="text-2xl font-black text-slate-800 mt-2">PHIẾU TÍNH TIỀN TẠM TÍNH</h1>
            <p className="text-xs text-slate-500">Mã đơn: <span className="font-mono font-bold text-slate-700">{currentOrder.orderId}</span></p>
            <p className="text-xs text-slate-400">{currentOrder.createdAt}</p>
          </div>

          <div className="grid grid-cols-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <div>Bàn phục vụ: <strong className="text-slate-900">{currentOrder.tableId}</strong></div>
            <div>Khu vực: <strong className="text-slate-900">{tableInfo?.areaName}</strong></div>
            <div>Sức chứa: <span>{tableInfo?.capacity} khách</span></div>
            <div>Trạng thái đơn: <span className="text-blue-600 font-semibold">{currentOrder.status}</span></div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chi tiết sản phẩm</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500 text-xs">
                  <th className="py-2">Món</th>
                  <th className="py-2 text-center">SL</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOrder.details.map((item) => (
                  <tr key={item.orderDetailId} className="text-slate-700">
                    <td className="py-2 font-medium">{item.productName}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                    <td className="py-2 text-right font-semibold">{item.totalPrice.toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Tổng tiền sản phẩm:</span>
              <span>{currentOrder.totalProductPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Tiền giảm giá:</span>
              <span>-{currentOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between">
              <span>Tiền thuế (VAT 8%):</span>
              <span>+{currentOrder.taxAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t">
              <span>TỔNG CỘNG THANH TOÁN:</span>
              <span className="text-blue-600 text-lg">{currentOrder.totalOrderPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setCurrentOrder(null);
                setSelectedItems({});
                setDiscountPercent(0);
                setForceConfirmTable(false);
              }}
              className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition"
            >
              ← Quay lại danh sách quản lý
            </button>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // GIAO DIỆN CHÍNH: QUẢN LÝ BÀN, FORM TẠO ĐƠN & DANH SÁCH ĐƠN
  // -------------------------------------------------------------
  const alertMeta = selectedTable ? getAlertStyle(selectedTable.status) : null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hệ Thống Phục Vụ &amp; Quản Lý Bàn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chức năng: Cập nhật trạng thái bàn, tạo đơn xuất bill, lưu vĩnh viễn trên máy và xóa đơn hàng
          </p>
        </div>

        {/* ================= PHẦN 1: QUẢN LÝ BÀN ================= */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Sơ Đồ &amp; Trạng Thái Bàn</h2>
              <p className="text-xs text-slate-500">Tích chọn các bàn để đổi trạng thái nhiều bàn cùng lúc</p>
            </div>

            {/* Thanh công cụ cập nhật hàng loạt */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 pl-1">
                Đã chọn ({selectedTableIds.length}) bàn:
              </span>
              <select
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value as TableStatus)}
                className="text-xs font-medium bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="AVAILABLE">Khả dụng</option>
                <option value="OCCUPIED">Đang được sử dụng</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
                <option value="OUT_OF_SERVICE">Ngừng sử dụng</option>
              </select>
              <button
                type="button"
                onClick={handleUpdateBatchStatus}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTableIds.length === tables.length && tables.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Mã Bàn</th>
                  <th className="p-3">Khu Vực</th>
                  <th className="p-3 text-center">Sức Chứa</th>
                  <th className="p-3">Trạng Thái Hiện Tại</th>
                  <th className="p-3">Đổi Trạng Thái Trực Tiếp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tables.map((table) => {
                  const isChecked = selectedTableIds.includes(table.tableId);
                  const statusMeta = TABLE_STATUS_LABEL[table.status];

                  return (
                    <tr key={table.tableId} className={`hover:bg-slate-50 transition ${isChecked ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectTable(table.tableId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">{table.tableId}</td>
                      <td className="p-3 text-slate-600">{table.areaName}</td>
                      <td className="p-3 text-center font-medium text-slate-600">{table.capacity} chỗ</td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={table.status}
                          onChange={(e) => handleUpdateSingleStatus(table.tableId, e.target.value as TableStatus)}
                          className="text-xs bg-white border border-slate-200 rounded-md p-1 font-medium text-slate-700"
                        >
                          <option value="AVAILABLE">Khả dụng</option>
                          <option value="OCCUPIED">Đang được sử dụng</option>
                          <option value="MAINTENANCE">Đang bảo trì</option>
                          <option value="OUT_OF_SERVICE">Ngừng sử dụng</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= PHẦN 2: TẠO ĐƠN CHO BÀN ================= */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Tạo Đơn Hàng Mới Cho Bàn</h2>
          <p className="text-xs text-slate-500 mb-6">Chọn bàn, kiểm tra trạng thái và chọn món</p>

          <form onSubmit={handleCreateOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Chọn Bàn Phục Vụ</label>
                <select
                  value={targetTableId}
                  onChange={(e) => handleSelectTargetTable(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {tables.map((t) => (
                    <option key={t.tableId} value={t.tableId}>
                      {t.tableId} - {t.areaName} ({TABLE_STATUS_LABEL[t.status].label})
                    </option>
                  ))}
                </select>

                {/* NOTE CẢNH BÁO CHO TRẠNG THÁI KHÔNG KHẢ DỤNG */}
                {isTableNotAvailable && selectedTable && alertMeta && (
                  <div className={`mt-3 p-4 border-l-4 rounded-r-xl space-y-2 transition-all ${alertMeta.container}`}>
                    <div className="flex items-start gap-2">
                      <span className={`font-bold text-base ${alertMeta.title}`}>⚠️ Cảnh báo nghiệp vụ:</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Bàn <strong className="font-bold underline">{selectedTable.tableId}</strong> hiện đang ở trạng thái{' '}
                      <span className={`font-bold uppercase ${alertMeta.badge}`}>
                        {TABLE_STATUS_LABEL[selectedTable.status].label}
                      </span>. 
                      <br />
                      {alertMeta.note}
                    </p>

                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={forceConfirmTable}
                        onChange={(e) => setForceConfirmTable(e.target.checked)}
                        className={`rounded w-4 h-4 cursor-pointer ${alertMeta.checkbox}`}
                      />
                      <span className="text-xs font-bold">
                        Xác nhận: Tôi vẫn muốn tạo đơn cho bàn này
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                         Chiết Khấu / Giảm Giá (%)
                  </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={discountPercent === 0 ? '' : discountPercent}
                      onChange={(e) => {
      
                       const cleaned = e.target.value.replace(/\D/g, '');
                       const num = cleaned === '' ? 0 : Math.min(100, Number(cleaned));
                      setDiscountPercent(num);
                          }}
                       placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
            </div>

            {/* Danh mục chọn món */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Chọn Món Ăn &amp; Số Lượng</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MENU_PRODUCTS.map((prod) => {
                  const qty = selectedItems[prod.id] || 0;
                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        qty > 0 ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{prod.name}</p>
                        <p className="text-xs text-blue-600 font-bold">{prod.price.toLocaleString('vi-VN')} đ</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(prod.id, qty - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-slate-800">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(prod.id, qty + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition"
              >
                Tạo Đơn &amp; Xuất Hóa Đơn Tạm Tính →
              </button>
            </div>
          </form>
        </section>

        {/* ================= PHẦN 3: LỊCH SỬ ĐƠN (LƯU TRÊN MÁY) & NÚT XÓA ================= */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Danh Sách Đơn Hàng Đã Lưu Trên Máy ({orders.length})
              </h2>
              <p className="text-xs text-slate-500">Đơn hàng được lưu trữ trong localStorage (tải lại trang không bị mất)</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic border border-dashed rounded-xl">
              Chưa có đơn hàng nào được lưu trên máy. Hãy tạo đơn cho một bàn ở trên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Mã Bàn</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3 text-right">Tiền Món</th>
                    <th className="p-3 text-right">Giảm Giá</th>
                    <th className="p-3 text-right">Thuế (8%)</th>
                    <th className="p-3 text-right">Tổng Tiền Đơn</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{ord.orderId}</td>
                      <td className="p-3 font-semibold text-blue-600">{ord.tableId}</td>
                      <td className="p-3 text-xs text-slate-500">{ord.createdAt}</td>
                      <td className="p-3 text-right text-slate-700">{ord.totalProductPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-right text-rose-600">-{ord.discountAmount.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-right text-slate-500">+{ord.taxAmount.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-right font-bold text-slate-900">{ord.totalOrderPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetail(ord)}
                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Xem chi tiết
                          </button>
                          {/* NÚT XÓA ĐƠN HÀNG */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(ord.orderId)}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold px-2.5 py-1.5 rounded-lg transition"
                            title="Xóa đơn hàng này khỏi máy"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ================= MODAL HIỂN THỊ CHI TIẾT ĐƠN ================= */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fadeIn border border-slate-200">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi Tiết Đơn Hàng</h3>
                <p className="text-xs text-slate-500">
                  Mã đơn: <span className="font-mono font-bold text-blue-600">{viewingOrderDetails.orderId}</span> - Bàn:{' '}
                  <span className="font-bold text-slate-800">{viewingOrderDetails.tableId}</span> ({viewingOrderDetails.createdAt})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrderDetails(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* BẢNG CHI TIẾT ĐƠN ĐÚNG CÁC TRƯỜNG YÊU CẦU */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Mã Chi Tiết Đơn</th>
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Tên Sản Phẩm</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                    <th className="p-3 text-center">Số Lượng</th>
                    <th className="p-3 text-right">Tổng Tiền Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingOrderDetails.details.map((dtl) => (
                    <tr key={dtl.orderDetailId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs font-semibold text-slate-600">{dtl.orderDetailId}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{dtl.orderId}</td>
                      <td className="p-3 font-medium text-slate-900">{dtl.productName}</td>
                      <td className="p-3 text-right text-slate-700">{dtl.unitPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-center font-bold text-slate-800">{dtl.quantity}</td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        {dtl.totalPrice.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tóm tắt thanh toán của đơn */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tổng tiền sản phẩm:</span>
                <span className="font-semibold">{viewingOrderDetails.totalProductPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Giảm giá:</span>
                <span className="font-semibold">-{viewingOrderDetails.discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế VAT (8%):</span>
                <span className="font-semibold">+{viewingOrderDetails.taxAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Tổng tiền đơn hàng:</span>
                <span className="text-blue-600 text-base">{viewingOrderDetails.totalOrderPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => handleDeleteOrder(viewingOrderDetails.orderId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                Xóa đơn hàng này
              </button>
              <button
                type="button"
                onClick={() => setViewingOrderDetails(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}