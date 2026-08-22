import { describe, expect, it } from 'vitest';
import { amSangDuong, canChiNam, duongSangAm, gioKeTiep } from './amLich';

describe('đổi dương lịch sang âm lịch', () => {
  it('mùng 1 Tết các năm gần đây', () => {
    // Tết Quý Mão 2023: 22/01/2023
    expect(duongSangAm(22, 1, 2023)).toMatchObject({ ngay: 1, thang: 1, nam: 2023 });
    // Tết Giáp Thìn 2024: 10/02/2024
    expect(duongSangAm(10, 2, 2024)).toMatchObject({ ngay: 1, thang: 1, nam: 2024 });
    // Tết Ất Tỵ 2025: 29/01/2025
    expect(duongSangAm(29, 1, 2025)).toMatchObject({ ngay: 1, thang: 1, nam: 2025 });
    // Tết Bính Ngọ 2026: 17/02/2026
    expect(duongSangAm(17, 2, 2026)).toMatchObject({ ngay: 1, thang: 1, nam: 2026 });
  });

  it('giỗ Tổ Hùng Vương mùng 10 tháng 3 âm', () => {
    expect(duongSangAm(18, 4, 2024)).toMatchObject({ ngay: 10, thang: 3, nam: 2024 });
    expect(duongSangAm(7, 4, 2025)).toMatchObject({ ngay: 10, thang: 3, nam: 2025 });
  });

  it('nhận ra tháng nhuận', () => {
    // Năm Giáp Thìn 2023 âm lịch có tháng 2 nhuận (22/03/2023 là 1/2 nhuận)
    const a = duongSangAm(22, 3, 2023);
    expect(a.thang).toBe(2);
    expect(a.nhuan).toBe(true);
  });
});

describe('đổi âm lịch sang dương lịch', () => {
  it('khớp với chiều ngược lại', () => {
    expect(amSangDuong(1, 1, 2025)).toEqual([29, 1, 2025]);
    expect(amSangDuong(10, 3, 2025)).toEqual([7, 4, 2025]);
    expect(amSangDuong(15, 8, 2025)).toEqual([6, 10, 2025]); // Trung thu 2025
  });

  it('đi vòng dương -> âm -> dương không đổi', () => {
    for (const [d, m, y] of [
      [1, 1, 2020],
      [29, 2, 2024],
      [31, 12, 2026],
      [15, 6, 1998],
    ] as const) {
      const a = duongSangAm(d, m, y);
      expect(amSangDuong(a.ngay, a.thang, a.nam, a.nhuan)).toEqual([d, m, y]);
    }
  });

  it('tháng nhuận không tồn tại thì trả về undefined', () => {
    expect(amSangDuong(1, 5, 2025, true)).toBeUndefined();
  });
});

describe('can chi', () => {
  it('tên năm âm lịch', () => {
    expect(canChiNam(2024)).toBe('Giáp Thìn');
    expect(canChiNam(2025)).toBe('Ất Tỵ');
    expect(canChiNam(2026)).toBe('Bính Ngọ');
    expect(canChiNam(1945)).toBe('Ất Dậu');
  });
});

describe('ngày giỗ kế tiếp', () => {
  it('lấy đúng ngày giỗ sắp tới sau mốc', () => {
    const moc = new Date(2026, 7, 22); // 22/08/2026
    const d = gioKeTiep({ ngay: 10, thang: 3 }, moc);
    expect(d.getTime()).toBeGreaterThanOrEqual(moc.getTime());
    const a = duongSangAm(d.getDate(), d.getMonth() + 1, d.getFullYear());
    expect(a.ngay).toBe(10);
    expect(a.thang).toBe(3);
  });

  it('giỗ còn trong năm thì không nhảy sang năm sau', () => {
    const moc = new Date(2026, 0, 5);
    const d = gioKeTiep({ ngay: 15, thang: 8 }, moc);
    expect(d.getFullYear()).toBe(2026);
  });
});
