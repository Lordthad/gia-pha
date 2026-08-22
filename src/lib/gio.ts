import type { Person } from '../types/giapha';
import { conBaoNhieuNgay, duongSangAm, gioKeTiep } from './amLich';
import type { ChiMuc } from './chiMuc';

export interface NgayGio {
  ngay: number;
  thang: number;
  nhuan?: boolean;
  /** Ngày giỗ được suy ra từ ngày mất dương lịch chứ không phải ghi trực tiếp. */
  suyRa: boolean;
}

/**
 * Ngày giỗ âm lịch của một người: lấy trường `gioAm` nếu có,
 * không thì quy đổi từ ngày mất dương lịch.
 */
export function ngayGioCua(p: Person): NgayGio | undefined {
  if (p.gioAm) return { ...p.gioAm, suyRa: false };
  if (p.mat?.am?.ngay && p.mat.am.thang) {
    return { ngay: p.mat.am.ngay, thang: p.mat.am.thang, nhuan: p.mat.am.nhuan, suyRa: false };
  }
  const d = p.mat?.duong;
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, ng] = d.split('-').map(Number);
    const am = duongSangAm(ng, m, y);
    return { ngay: am.ngay, thang: am.thang, nhuan: am.nhuan, suyRa: true };
  }
  return undefined;
}

export interface MucGio {
  nguoi: Person;
  gio: NgayGio;
  ngayDuong: Date;
  conNgay: number;
}

/** Danh sách giỗ sắp tới trong `soNgay` ngày, sắp theo thứ tự gần nhất trước. */
export function gioSapToi(ci: ChiMuc, soNgay = 60, moc: Date = new Date()): MucGio[] {
  const kq: MucGio[] = [];
  for (const p of ci.giaPha.nguoi) {
    const gio = ngayGioCua(p);
    if (!gio) continue;
    const ngayDuong = gioKeTiep(gio, moc);
    const conNgay = conBaoNhieuNgay(ngayDuong, moc);
    if (conNgay >= 0 && conNgay <= soNgay) kq.push({ nguoi: p, gio, ngayDuong, conNgay });
  }
  return kq.sort((a, b) => a.conNgay - b.conNgay || a.nguoi.hoTen.localeCompare(b.nguoi.hoTen, 'vi'));
}

/** Toàn bộ ngày giỗ trong họ, nhóm theo tháng âm lịch. */
export function gioTheoThang(ci: ChiMuc, moc: Date = new Date()): Map<number, MucGio[]> {
  const theoThang = new Map<number, MucGio[]>();
  for (const p of ci.giaPha.nguoi) {
    const gio = ngayGioCua(p);
    if (!gio) continue;
    const ngayDuong = gioKeTiep(gio, moc);
    const muc: MucGio = { nguoi: p, gio, ngayDuong, conNgay: conBaoNhieuNgay(ngayDuong, moc) };
    const ds = theoThang.get(gio.thang);
    if (ds) ds.push(muc);
    else theoThang.set(gio.thang, [muc]);
  }
  for (const [, ds] of theoThang) ds.sort((a, b) => a.gio.ngay - b.gio.ngay);
  return theoThang;
}

/** Chuỗi "còn 3 ngày" / "hôm nay" / "ngày mai". */
export function conBaoLau(conNgay: number): string {
  if (conNgay === 0) return 'Hôm nay';
  if (conNgay === 1) return 'Ngày mai';
  if (conNgay < 0) return `${-conNgay} ngày trước`;
  return `Còn ${conNgay} ngày`;
}
