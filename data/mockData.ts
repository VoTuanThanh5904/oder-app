import { Table, Product } from '@/types';

export const INITIAL_TABLES: Table[] = [
  { tableId: 'B01', areaName: 'Khu A (Trong nhà)', capacity: 4, status: 'AVAILABLE' },
  { tableId: 'B02', areaName: 'Khu A (Trong nhà)', capacity: 4, status: 'OCCUPIED' },
  { tableId: 'B03', areaName: 'Khu A (Trong nhà)', capacity: 6, status: 'AVAILABLE' },
  { tableId: 'B04', areaName: 'Khu B (Sân vườn)', capacity: 2, status: 'MAINTENANCE' },
  { tableId: 'B05', areaName: 'Khu B (Sân vườn)', capacity: 4, status: 'AVAILABLE' },
  { tableId: 'B06', areaName: 'Khu VIP (Tầng 2)', capacity: 10, status: 'OUT_OF_SERVICE' },
];

export const MENU_PRODUCTS: Product[] = [
  { id: 'P01', name: 'Cà phê Phin Sữa Đá', price: 35000 },
  { id: 'P02', name: 'Bạc Xỉu Kem Trứng', price: 45000 },
  { id: 'P03', name: 'Trà Đào Cam Sả', price: 49000 },
  { id: 'P04', name: 'Bò Bít Tết Sốt Tiêu Đen', price: 189000 },
  { id: 'P05', name: 'Mì Ý Sốt Bò Bằm Bolognaise', price: 95000 },
  { id: 'P06', name: 'Khoai Tây Chiên Phô Mai', price: 50000 },
];