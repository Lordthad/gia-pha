import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  catToken,
  daKhaiKho,
  docKho,
  doiKhoaToken,
  KHO_TRONG,
  layToken,
  sanSangDay,
  xoaKho,
  xoaToken,
} from './github';

// Vitest chạy trong Node nên không có localStorage; dựng bản giả lập trong bộ nhớ.
const boNho = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => boNho.get(k) ?? null,
  setItem: (k: string, v: string) => void boNho.set(k, v),
  removeItem: (k: string) => void boNho.delete(k),
  clear: () => boNho.clear(),
});

const KHO = { ...KHO_TRONG, chuSoHuu: 'nguyendinh', kho: 'gia-pha' };
const TOKEN = 'github_pat_11ABCDEFG_khongphaimathat';

beforeEach(() => {
  localStorage.clear();
});

describe('cất mã truy cập GitHub', () => {
  it('mã quản trị đúng thì lấy lại được mã truy cập', async () => {
    const luu = await catToken(KHO, TOKEN, 'truongtoc2026');
    expect(await layToken(luu, 'truongtoc2026')).toBe(TOKEN);
  });

  it('mã quản trị sai thì không lấy được', async () => {
    const luu = await catToken(KHO, TOKEN, 'truongtoc2026');
    expect(await layToken(luu, 'doan-bua')).toBeUndefined();
  });

  it('thứ nằm trong máy không lộ mã truy cập', async () => {
    await catToken(KHO, TOKEN, 'truongtoc2026');
    const trongMay = localStorage.getItem('gia-pha:github') ?? '';
    expect(trongMay).not.toContain(TOKEN);
    expect(trongMay).not.toContain('github_pat');
    expect(trongMay).toContain('nguyendinh'); // tên kho không phải thứ bí mật
  });

  it('đọc lại từ máy vẫn mở được', async () => {
    await catToken(KHO, TOKEN, 'truongtoc2026');
    expect(await layToken(docKho(), 'truongtoc2026')).toBe(TOKEN);
  });

  it('đổi mã quản trị thì mã truy cập theo mã mới', async () => {
    const luu = await catToken(KHO, TOKEN, 'ma-cu-2025');
    const moi = await doiKhoaToken(luu, 'ma-cu-2025', 'ma-moi-2026');
    expect(moi).toBeDefined();
    expect(await layToken(moi!, 'ma-moi-2026')).toBe(TOKEN);
    expect(await layToken(moi!, 'ma-cu-2025')).toBeUndefined();
  });

  it('đổi khoá bằng mã cũ sai thì không làm gì cả', async () => {
    const luu = await catToken(KHO, TOKEN, 'ma-cu-2025');
    expect(await doiKhoaToken(luu, 'nhotham', 'ma-moi-2026')).toBeUndefined();
    expect(await layToken(docKho(), 'ma-cu-2025')).toBe(TOKEN);
  });

  it('xoá mã truy cập nhưng giữ khai báo kho', async () => {
    const luu = await catToken(KHO, TOKEN, 'truongtoc2026');
    const sau = xoaToken(luu);
    expect(sau.tokenMaHoa).toBeUndefined();
    expect(sau.chuSoHuu).toBe('nguyendinh');
    expect(await layToken(sau, 'truongtoc2026')).toBeUndefined();
  });

  it('xoá cả khai báo thì máy sạch trơn', async () => {
    await catToken(KHO, TOKEN, 'truongtoc2026');
    xoaKho();
    expect(localStorage.getItem('gia-pha:github')).toBeNull();
    expect(docKho()).toEqual(KHO_TRONG);
    expect(docKho().tokenMaHoa).toBeUndefined();
  });
});

describe('điều kiện đưa lên mạng', () => {
  it('thiếu tên kho hoặc thiếu mã truy cập thì chưa đẩy được', () => {
    expect(daKhaiKho({ ...KHO_TRONG, chuSoHuu: '', kho: '' })).toBe(false);
    expect(daKhaiKho(KHO)).toBe(true);
    expect(sanSangDay({ ...KHO, token: '' })).toBe(false);
    expect(sanSangDay({ ...KHO_TRONG, chuSoHuu: '', kho: '', token: TOKEN })).toBe(false);
    expect(sanSangDay({ ...KHO, token: TOKEN })).toBe(true);
  });
});
