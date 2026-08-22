import { describe, expect, it } from 'vitest';
import { bamMa, doManhMatKhau, giaiMa, kiemTraMa, laGoiMaHoa, maHoa, MatKhauSai } from './baoMat';

const MAU = JSON.stringify({ nguoi: [{ id: 'P001', hoTen: 'Nguyễn Đình Bảng' }] });

describe('mã hoá dữ liệu gia phả', () => {
  it('mã hoá rồi giải mã ra đúng nội dung cũ', async () => {
    const goi = await maHoa(MAU, 'cay-da-dau-lang-1954');
    expect(await giaiMa(goi, 'cay-da-dau-lang-1954')).toBe(MAU);
  });

  it('nội dung đã mã hoá không còn lộ tên người', async () => {
    const goi = await maHoa(MAU, 'cay-da-dau-lang-1954');
    const ca = JSON.stringify(goi);
    expect(ca).not.toContain('Nguyễn');
    expect(ca).not.toContain('P001');
    expect(ca).not.toContain('hoTen');
  });

  it('sai mật khẩu thì báo lỗi chứ không trả bừa', async () => {
    const goi = await maHoa(MAU, 'mat-khau-that-cua-ho');
    await expect(giaiMa(goi, 'doan-mo')).rejects.toBeInstanceOf(MatKhauSai);
  });

  it('mỗi lần mã hoá dùng muối và vector khác nhau', async () => {
    const a = await maHoa(MAU, 'cung-mot-mat-khau');
    const b = await maHoa(MAU, 'cung-mot-mat-khau');
    expect(a.muoi).not.toBe(b.muoi);
    expect(a.vector).not.toBe(b.vector);
    expect(a.duLieu).not.toBe(b.duLieu);
  });

  it('nhận ra file đã mã hoá', async () => {
    expect(laGoiMaHoa(await maHoa(MAU, 'abc12345'))).toBe(true);
    expect(laGoiMaHoa(JSON.parse(MAU))).toBe(false);
    expect(laGoiMaHoa(null)).toBe(false);
  });

  it('giữ nguyên tiếng Việt có dấu qua một vòng mã hoá', async () => {
    const chu = 'Cụ Nguyễn Đình Bảng — giỗ ngày 12 tháng 8 âm lịch, mộ ở đồng Cửa Chùa.';
    const goi = await maHoa(chu, 'mat-khau-du-dai-12');
    expect(await giaiMa(goi, 'mat-khau-du-dai-12')).toBe(chu);
  });
});

describe('mã quản trị', () => {
  it('băm rồi kiểm tra lại đúng', async () => {
    const b = await bamMa('mabimat');
    expect(await kiemTraMa('mabimat', b)).toBe(true);
    expect(await kiemTraMa('sai-roi', b)).toBe(false);
  });

  it('không lưu mã dạng chữ thật', async () => {
    const b = await bamMa('mabimat');
    expect(JSON.stringify(b)).not.toContain('mabimat');
  });
});

describe('đánh giá độ mạnh mật khẩu', () => {
  it('chặn mật khẩu quá ngắn', () => {
    expect(doManhMatKhau('1234').diem).toBe(0);
    expect(doManhMatKhau('abcdefg').diem).toBe(0);
  });

  it('mật khẩu dài và nhiều loại ký tự được chấm cao hơn', () => {
    expect(doManhMatKhau('hodongho2024').diem).toBeGreaterThan(0);
    expect(doManhMatKhau('cay-da-dau-lang-1954').diem).toBe(3);
  });
});
