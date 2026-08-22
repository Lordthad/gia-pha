import type { GioiTinh, Person } from '../types/giapha';
import { daMat, namSinh, type ChiMuc } from './chiMuc';
import { chuanHoa } from './tiengViet';

export interface BoLoc {
  tuKhoa?: string;
  doi?: number;
  chiNhanh?: string;
  gioiTinh?: GioiTinh;
  trangThai?: 'con-song' | 'da-mat';
  coGio?: boolean;
}

/** Các trường được đưa vào tìm kiếm. */
function vanBanTim(p: Person): string {
  return [
    p.hoTen,
    p.tenThuong,
    p.tenHuy,
    p.tenTu,
    p.chiNhanh,
    p.queQuan,
    p.noiO,
    p.ngheNghiep,
    p.congDuc,
    p.ghiChu,
    p.moPhan?.nghiaTrang,
    p.moPhan?.moTa,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Chấm điểm mức độ khớp: khớp đầu tên được ưu tiên hơn khớp giữa chuỗi,
 * khớp tên được ưu tiên hơn khớp trong phần ghi chú.
 */
function chamDiem(p: Person, tu: string): number {
  const ten = chuanHoa(p.hoTen);
  const thuong = chuanHoa(p.tenThuong ?? '');
  if (ten === tu || thuong === tu) return 100;
  if (ten.startsWith(tu) || thuong.startsWith(tu)) return 80;
  if (ten.includes(tu) || thuong.includes(tu)) return 60;
  const khac = chuanHoa([p.tenHuy, p.tenTu].filter(Boolean).join(' '));
  if (khac.includes(tu)) return 50;
  if (chuanHoa(vanBanTim(p)).includes(tu)) return 20;
  return 0;
}

/** Tìm và lọc người trong gia phả; kết quả đã sắp xếp. */
export function timNguoi(ci: ChiMuc, loc: BoLoc): Person[] {
  const tu = loc.tuKhoa ? chuanHoa(loc.tuKhoa) : '';
  const kq: Array<{ p: Person; diem: number }> = [];

  for (const p of ci.giaPha.nguoi) {
    if (loc.doi != null && ci.doi.get(p.id) !== loc.doi) continue;
    if (loc.chiNhanh && p.chiNhanh !== loc.chiNhanh) continue;
    if (loc.gioiTinh && p.gioiTinh !== loc.gioiTinh) continue;
    if (loc.trangThai === 'da-mat' && !daMat(p)) continue;
    if (loc.trangThai === 'con-song' && daMat(p)) continue;
    if (loc.coGio && !p.gioAm) continue;
    const diem = tu ? chamDiem(p, tu) : 1;
    if (diem === 0) continue;
    kq.push({ p, diem });
  }

  kq.sort((a, b) => {
    if (b.diem !== a.diem) return b.diem - a.diem;
    const da = ci.doi.get(a.p.id) ?? 99;
    const db = ci.doi.get(b.p.id) ?? 99;
    if (da !== db) return da - db;
    const na = namSinh(a.p) ?? 9999;
    const nb = namSinh(b.p) ?? 9999;
    if (na !== nb) return na - nb;
    return a.p.hoTen.localeCompare(b.p.hoTen, 'vi');
  });

  return kq.map((x) => x.p);
}

/** Danh sách chi/nhánh có trong gia phả. */
export function cacChiNhanh(ci: ChiMuc): string[] {
  const s = new Set<string>();
  for (const p of ci.giaPha.nguoi) if (p.chiNhanh) s.add(p.chiNhanh);
  return [...s].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Danh sách các đời có người. */
export function cacDoi(ci: ChiMuc): number[] {
  return [...ci.theoDoi.keys()].sort((a, b) => a - b);
}

export interface ThongKe {
  tongSo: number;
  soDoi: number;
  soChi: number;
  daMat: number;
  conSong: number;
  nam: number;
  nu: number;
}

export function thongKe(ci: ChiMuc): ThongKe {
  const ds = ci.giaPha.nguoi;
  return {
    tongSo: ds.length,
    soDoi: ci.theoDoi.size,
    soChi: cacChiNhanh(ci).length,
    daMat: ds.filter(daMat).length,
    conSong: ds.filter((p) => !daMat(p)).length,
    nam: ds.filter((p) => p.gioiTinh === 'nam').length,
    nu: ds.filter((p) => p.gioiTinh === 'nu').length,
  };
}
