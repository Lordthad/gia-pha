import { beforeEach, describe, expect, it, vi } from 'vitest';
import { matKhauDaNho, nhoMatKhau, quenMatKhau } from './luuTru';

// Vitest chạy trong Node nên không có localStorage/sessionStorage; dựng bản giả lập.
function khoGiaLap() {
  const boNho = new Map<string, string>();
  return {
    getItem: (k: string) => boNho.get(k) ?? null,
    setItem: (k: string, v: string) => void boNho.set(k, v),
    removeItem: (k: string) => void boNho.delete(k),
    clear: () => boNho.clear(),
  };
}

const cucBo = khoGiaLap();
const phien = khoGiaLap();
vi.stubGlobal('localStorage', cucBo);
vi.stubGlobal('sessionStorage', phien);

beforeEach(() => {
  cucBo.clear();
  phien.clear();
});

describe('ghi nhớ mã xem', () => {
  it('nhớ lâu dài thì đóng trình duyệt mở lại vẫn còn', () => {
    nhoMatKhau('cay-da-dau-lang-1954', true);
    // Đóng trình duyệt = mất sessionStorage, giữ localStorage.
    phien.clear();
    expect(matKhauDaNho()).toBe('cay-da-dau-lang-1954');
  });

  it('chỉ nhớ trong phiên thì đóng trình duyệt là mất', () => {
    nhoMatKhau('cay-da-dau-lang-1954', false);
    expect(matKhauDaNho()).toBe('cay-da-dau-lang-1954');
    phien.clear();
    expect(matKhauDaNho()).toBeUndefined();
  });

  it('bản trong phiên được ưu tiên hơn bản cũ lưu lâu dài', () => {
    nhoMatKhau('ma-cu', true);
    nhoMatKhau('ma-vua-nhap', false);
    expect(matKhauDaNho()).toBe('ma-vua-nhap');
  });

  it('quên thì xoá sạch cả hai chỗ', () => {
    nhoMatKhau('ma-cu', true);
    nhoMatKhau('ma-cu', false);
    quenMatKhau();
    expect(matKhauDaNho()).toBeUndefined();
    expect(cucBo.getItem('gia-pha:mat-khau')).toBeNull();
    expect(phien.getItem('gia-pha:mat-khau')).toBeNull();
  });

  it('chưa nhớ gì thì không trả bừa', () => {
    expect(matKhauDaNho()).toBeUndefined();
  });
});
