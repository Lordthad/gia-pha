import type { BamMa, GoiMaHoa } from '../types/giapha';

/**
 * Mã hoá dữ liệu gia phả bằng mật khẩu, dùng Web Crypto có sẵn của trình duyệt:
 * khoá dẫn xuất bằng PBKDF2-SHA256, nội dung mã hoá bằng AES-GCM 256 bit.
 *
 * File đưa lên mạng chỉ là chuỗi đã mã hoá. Không có mật khẩu thì tải về cũng
 * không đọc được — khác hẳn với việc chỉ che bằng màn hình đăng nhập.
 */

const VONG_MAC_DINH = 250_000;

export class MatKhauSai extends Error {
  constructor() {
    super('Mật khẩu không đúng');
    this.name = 'MatKhauSai';
  }
}

/** Web Crypto chỉ chạy trên https hoặc localhost. */
export function coTheMaHoa(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

function sangB64(buf: ArrayBuffer | Uint8Array): string {
  const mang = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of mang) s += String.fromCharCode(b);
  return btoa(s);
}

function tuB64(s: string): Uint8Array {
  const chu = atob(s);
  const mang = new Uint8Array(chu.length);
  for (let i = 0; i < chu.length; i++) mang[i] = chu.charCodeAt(i);
  return mang;
}

async function dungKhoa(
  matKhau: string,
  muoi: Uint8Array,
  vong: number,
  dung: KeyUsage[],
): Promise<CryptoKey> {
  const goc = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(matKhau),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: muoi as BufferSource, iterations: vong, hash: 'SHA-256' },
    goc,
    { name: 'AES-GCM', length: 256 },
    false,
    dung,
  );
}

export function laGoiMaHoa(x: unknown): x is GoiMaHoa {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as GoiMaHoa).maHoa === 'aes-gcm-256' &&
    typeof (x as GoiMaHoa).duLieu === 'string'
  );
}

export async function maHoa(
  vanBan: string,
  matKhau: string,
  capNhat?: string,
): Promise<GoiMaHoa> {
  const muoi = crypto.getRandomValues(new Uint8Array(16));
  const vector = crypto.getRandomValues(new Uint8Array(12));
  const khoa = await dungKhoa(matKhau, muoi, VONG_MAC_DINH, ['encrypt']);
  const kq = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: vector as BufferSource },
    khoa,
    new TextEncoder().encode(vanBan),
  );
  return {
    maHoa: 'aes-gcm-256',
    phienBan: 1,
    vong: VONG_MAC_DINH,
    muoi: sangB64(muoi),
    vector: sangB64(vector),
    duLieu: sangB64(kq),
    capNhat,
  };
}

/** Giải mã; mật khẩu sai thì ném MatKhauSai. */
export async function giaiMa(goi: GoiMaHoa, matKhau: string): Promise<string> {
  const muoi = tuB64(goi.muoi);
  const vector = tuB64(goi.vector);
  const khoa = await dungKhoa(matKhau, muoi, goi.vong ?? VONG_MAC_DINH, ['decrypt']);
  try {
    const kq = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: vector as BufferSource },
      khoa,
      tuB64(goi.duLieu) as BufferSource,
    );
    return new TextDecoder().decode(kq);
  } catch {
    throw new MatKhauSai();
  }
}

/* ---------------- Mã quản trị ---------------- */

/**
 * Băm mã quản trị để không phải lưu mã dạng chữ thật.
 * Đây chỉ là khoá cửa phòng quản trị cho gọn gàng, không phải lớp bảo mật thật:
 * người đã xem được gia phả thì vẫn sửa được bản sao trong máy họ.
 * Thứ thực sự chặn là quyền push lên kho mã nguồn.
 */
export async function bamMa(ma: string): Promise<BamMa> {
  const muoi = crypto.getRandomValues(new Uint8Array(16));
  const khoa = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ma),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bit = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: muoi as BufferSource, iterations: VONG_MAC_DINH, hash: 'SHA-256' },
    khoa,
    256,
  );
  return { muoi: sangB64(muoi), bam: sangB64(bit), vong: VONG_MAC_DINH };
}

export async function kiemTraMa(ma: string, luu: BamMa): Promise<boolean> {
  const khoa = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ma),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bit = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: tuB64(luu.muoi) as BufferSource,
      iterations: luu.vong ?? VONG_MAC_DINH,
      hash: 'SHA-256',
    },
    khoa,
    256,
  );
  return sangB64(bit) === luu.bam;
}

/* ---------------- Đánh giá độ mạnh mật khẩu ---------------- */

export interface DoManh {
  diem: 0 | 1 | 2 | 3;
  nhan: string;
  loiKhuyen?: string;
}

/**
 * File đã mã hoá nằm công khai trên mạng nên kẻ tò mò có thể dò mật khẩu
 * ngoại tuyến. Vì vậy mật khẩu ngắn là không đủ.
 */
export function doManhMatKhau(mk: string): DoManh {
  const dai = mk.length;
  const loai =
    (/[a-z]/.test(mk) ? 1 : 0) +
    (/[A-Z]/.test(mk) ? 1 : 0) +
    (/[0-9]/.test(mk) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(mk) ? 1 : 0);
  if (dai < 8) {
    return { diem: 0, nhan: 'Quá ngắn', loiKhuyen: 'Nên dài ít nhất 12 ký tự.' };
  }
  if (dai < 12 || loai < 2) {
    return {
      diem: 1,
      nhan: 'Yếu',
      loiKhuyen: 'Nên dùng một câu dễ nhớ, ví dụ "cay-da-dau-lang-1954".',
    };
  }
  if (dai < 16) return { diem: 2, nhan: 'Tạm được' };
  return { diem: 3, nhan: 'Tốt' };
}
