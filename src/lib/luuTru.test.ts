import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiaPha } from '../types/giapha';
import {
  ghiMocDaDay,
  luuBanNhap,
  matKhauDaNho,
  mocCapNhat,
  napGiaPha,
  nhoMatKhau,
  quenMatKhau,
} from './luuTru';

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

/* ---------------- Bản trong máy so với bản trên mạng ---------------- */

function giaPhaGia(capNhat: string, ten = 'Trong may'): GiaPha {
  return {
    dongHo: { ten },
    nguoi: [],
    honNhan: [],
    capNhat,
  } as unknown as GiaPha;
}

/** Giả lập file giapha.json đang nằm trên mạng. */
function trenMang(noiDung: unknown) {
  vi.stubGlobal('fetch', () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(noiDung) } as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', cucBo);
  vi.stubGlobal('sessionStorage', phien);
});

describe('mốc cập nhật của bản vừa xuất', () => {
  it('đọc được từ file chưa mã hoá', () => {
    expect(mocCapNhat('{"capNhat":"2026-01-02T03:04:05.000Z","nguoi":[]}')).toBe(
      '2026-01-02T03:04:05.000Z',
    );
  });

  it('đọc được từ file đã mã hoá vì mốc nằm ngoài phần mã hoá', () => {
    expect(mocCapNhat('{"maHoa":"aes-gcm-256","capNhat":"2026-05-05T00:00:00.000Z"}')).toBe(
      '2026-05-05T00:00:00.000Z',
    );
  });

  it('file hỏng thì trả về không có gì chứ không nổ', () => {
    expect(mocCapNhat('khong phai json')).toBeUndefined();
  });
});

describe('nạp gia phả khi trong máy còn bản cũ', () => {
  it('bản đang sửa dở thì giữ nguyên, chỉ kèm mốc trên mạng để đối chiếu', async () => {
    luuBanNhap(giaPhaGia('2026-01-01T00:00:00.000Z', 'Ban sua do'));
    trenMang(giaPhaGia('2026-06-01T00:00:00.000Z', 'Tren mang'));

    const kq = await napGiaPha();
    expect(kq.giaPha?.dongHo.ten).toBe('Ban sua do');
    expect(kq.tuBanNhap).toBe(true);
    expect(kq.capNhatTrenMang).toBe('2026-06-01T00:00:00.000Z');
  });

  it('bản đã đưa lên mà người khác đưa bản mới hơn thì tự lấy bản mới', async () => {
    const luc = '2026-01-01T00:00:00.000Z';
    luuBanNhap(giaPhaGia(luc, 'Ban da dua len'));
    ghiMocDaDay(luc);
    trenMang(giaPhaGia('2026-06-01T00:00:00.000Z', 'Tren mang'));

    const kq = await napGiaPha();
    expect(kq.giaPha?.dongHo.ten).toBe('Tren mang');
    expect(kq.tuBanNhap).toBe(false);
    // Việc dọn để người gọi làm, nhưng phải báo rõ là cần dọn.
    expect(kq.nenXoaBanNhap).toBe(true);
  });

  it('vừa đưa lên xong, website chưa dựng kịp thì vẫn dùng bản trong máy', async () => {
    const luc = '2026-06-01T00:00:00.000Z';
    luuBanNhap(giaPhaGia(luc, 'Ban vua dua len'));
    ghiMocDaDay(luc);
    trenMang(giaPhaGia('2026-01-01T00:00:00.000Z', 'Ban cu tren mang'));

    const kq = await napGiaPha();
    expect(kq.giaPha?.dongHo.ten).toBe('Ban vua dua len');
    // Không phải bản nháp nên không hiện thanh báo "chưa đưa lên mạng".
    expect(kq.tuBanNhap).toBe(false);
  });

  it('nạp hai lần chồng nhau vẫn ra cùng một kết quả', async () => {
    const luc = '2026-01-01T00:00:00.000Z';
    luuBanNhap(giaPhaGia(luc, 'Ban da dua len'));
    ghiMocDaDay(luc);
    trenMang(giaPhaGia('2026-06-01T00:00:00.000Z', 'Tren mang'));

    const [a, b] = await Promise.all([napGiaPha(), napGiaPha()]);
    expect(a.giaPha?.dongHo.ten).toBe('Tren mang');
    expect(b.giaPha?.dongHo.ten).toBe('Tren mang');
  });

  it('mất mạng thì vẫn mở được bản đã đưa lên đang giữ trong máy', async () => {
    const luc = '2026-06-01T00:00:00.000Z';
    luuBanNhap(giaPhaGia(luc, 'Ban trong may'));
    ghiMocDaDay(luc);
    vi.stubGlobal('fetch', () => Promise.reject(new Error('mat mang')));

    const kq = await napGiaPha();
    expect(kq.giaPha?.dongHo.ten).toBe('Ban trong may');
    expect(kq.tuBanNhap).toBe(false);
  });
});
