// 4 trạng thái của bàn
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export const TABLE_STATUS_LABEL: Record<TableStatus, { label: string; color: string }> = {
  AVAILABLE: { label: 'Khả dụng', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  OCCUPIED: { label: 'Đang được sử dụng', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  MAINTENANCE: { label: 'Đang bảo trì', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  OUT_OF_SERVICE: { label: 'Ngừng sử dụng', color: 'bg-slate-200 text-slate-700 border-slate-400' },
};

// Kiểu dữ liệu Bàn
export interface Table {
  tableId: string;       // Mã bàn
  areaName: string;      // Tên khu vực
  capacity: number;      // Sức chứa
  status: TableStatus;   // Trạng thái
}

// Kiểu dữ liệu Món ăn mẫu
export interface Product {
  id: string;
  name: string;
  price: number;
}

// Kiểu dữ liệu Chi tiết đơn
export interface OrderDetail {
  orderDetailId: string;  // Mã chi tiết đơn
  orderId: string;        // Mã đơn
  productName: string;    // Tên sản phẩm
  unitPrice: number;      // Đơn giá của sản phẩm
  quantity: number;       // Số lượng
  totalPrice: number;     // Tổng tiền của chi tiết đơn = unitPrice * quantity
}

// Kiểu dữ liệu Đơn hàng
export interface Order {
  orderId: string;        // Mã đơn
  tableId: string;        // Mã bàn
  totalProductPrice: number; // Tổng tiền sản phẩm
  taxAmount: number;      // Tiền thuế (VAT)
  discountAmount: number; // Tiền giảm giá
  totalOrderPrice: number;// Tổng tiền của đơn
  status: 'PENDING' | 'SERVING' | 'PAID' | 'CANCELLED'; // Trạng thái đơn
  createdAt: string;
  details: OrderDetail[]; // Danh sách chi tiết đơn kèm theo
}