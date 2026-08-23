import { describe, expect, it } from 'vitest';
import mau from '../../public/data/giapha-mau.json';
import type { GiaPha } from '../types/giapha';
import { cacNamTheoCanChi, canChiNam } from './amLich';
import { daMat, dungChiMuc } from './chiMuc';
import { uocKhoangNamMat, uocKhoangNamSinh } from './uocNam';

const ci = dungChiMuc(mau as unknown as GiaPha);

describe('tra năm từ can chi', () => {
  it('can chi lặp lại đúng 60 năm một lần', () => {
    expect(cacNamTheoCanChi('Giáp', 'Tý', 1850, 2000)).toEqual([1864, 1924, 1984]);
    expect(cacNamTheoCanChi('Ất', 'Dậu', 1900, 2000)).toEqual([1945]);
  });

  it('khớp với chiều ngược lại', () => {
    for (const nam of cacNamTheoCanChi('Bính', 'Ngọ', 1800, 2100)) {
      expect(canChiNam(nam)).toBe('Bính Ngọ');
    }
  });

  it('khoảng không chứa năm nào thì trả danh sách rỗng', () => {
    expect(cacNamTheoCanChi('Giáp', 'Tý', 1925, 1983)).toEqual([]);
  });
});

describe('ước khoảng năm sinh', () => {
  it('dựa vào năm sinh của cha khi có', () => {
    // P020 là con ông P009 (sinh 1925)
    const k = uocKhoangNamSinh(ci, ci.byId.get('P020')!);
    expect(k.tu).toBe(1925 + 16);
    expect(k.den).toBe(1925 + 55);
    expect(k.canCu).toContain('cha');
  });

  it('không có cha mẹ thì dựa vào người con', () => {
    // P001 là thuỷ tổ, không có cha mẹ; con cả P003 sinh 1898
    const p = { ...ci.byId.get('P001')!, sinh: undefined };
    const k = uocKhoangNamSinh(ci, p);
    expect(k.den).toBe(1898 - 16);
    expect(k.canCu).toContain('con');
  });

  it('khoảng đủ hẹp để chốt được một năm từ can chi', () => {
    const k = uocKhoangNamSinh(ci, ci.byId.get('P020')!);
    // Khoảng 39 năm nên mỗi can chi rơi vào nhiều nhất một năm.
    for (const can of ['Giáp', 'Ất', 'Bính']) {
      expect(cacNamTheoCanChi(can, 'Tý', k.tu, k.den).length).toBeLessThanOrEqual(1);
    }
  });

  it('không có mốc nào cũng không vỡ', () => {
    const k = uocKhoangNamSinh(ci, {
      id: 'XXX',
      hoTen: 'Người lạ',
      gioiTinh: 'nam',
    });
    expect(k.tu).toBeLessThan(k.den);
    expect(k.canCu).toBeTruthy();
  });
});

describe('ước khoảng năm mất', () => {
  it('sau năm sinh và trong quãng đời người', () => {
    const k = uocKhoangNamMat(ci, ci.byId.get('P009')!);
    expect(k.tu).toBe(1925);
    // Chặn ở năm hiện tại: không ai mất ở tương lai.
    expect(k.den).toBe(Math.min(1925 + 110, new Date().getFullYear()));
  });

  it('không bao giờ gợi ý năm ở tương lai', () => {
    const namNay = new Date().getFullYear();
    for (const p of ci.giaPha.nguoi) {
      expect(uocKhoangNamSinh(ci, p).den).toBeLessThanOrEqual(namNay);
      expect(uocKhoangNamMat(ci, p).den).toBeLessThanOrEqual(namNay);
    }
  });
});

describe('đánh dấu đã mất bằng tay', () => {
  it('tích ô đã mất là đủ, không cần ngày', () => {
    expect(daMat({ id: 'X', hoTen: 'Cụ không rõ năm', gioiTinh: 'nam', daMat: true })).toBe(true);
    expect(daMat({ id: 'Y', hoTen: 'Người còn sống', gioiTinh: 'nam' })).toBe(false);
  });

  it('có ngày mất hoặc ngày giỗ thì vẫn tự hiểu là đã mất', () => {
    expect(daMat({ id: 'X', hoTen: 'A', gioiTinh: 'nam', mat: { duong: '1998' } })).toBe(true);
    expect(daMat({ id: 'Y', hoTen: 'B', gioiTinh: 'nam', gioAm: { ngay: 12, thang: 8 } })).toBe(true);
  });
});
