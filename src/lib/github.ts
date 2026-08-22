import type { GiaPha, GoiMaHoa } from '../types/giapha';
import { giaiMa, maHoa } from './baoMat';
import { moiAnh } from './luuTru';

/**
 * Đưa dữ liệu thẳng lên kho GitHub bằng API, không cần cài git hay biết dòng lệnh.
 *
 * Mã truy cập GitHub được cất dưới dạng đã mã hoá bằng mã quản trị, nên người
 * không có mã quản trị dù ngồi đúng máy đó cũng không lấy ra dùng được.
 * Đây mới là cửa khoá thật của quyền sửa: không có mã truy cập thì không đổi
 * được thứ cả họ nhìn thấy.
 */

const KHOA_KHO = 'gia-pha:github';

/** Phần khai báo kho, không có gì bí mật nên cất thẳng. */
export interface KhoGitHub {
  chuSoHuu: string;
  kho: string;
  nhanh: string;
  /** Thư mục chứa dữ liệu trong kho, thường là "public". */
  thuMuc: string;
}

/** Những gì thật sự nằm trong máy: khai báo kho + mã truy cập đã mã hoá. */
export interface LuuGitHub extends KhoGitHub {
  tokenMaHoa?: GoiMaHoa;
}

/** Bộ thông tin đủ để gọi API, chỉ tồn tại trong bộ nhớ lúc đang dùng. */
export interface CauHinhGitHub extends KhoGitHub {
  token: string;
}

/**
 * Điền sẵn kho của dòng họ để người nhập liệu chỉ phải dán mỗi mã truy cập,
 * đỡ phải gõ lại trên điện thoại. Vẫn sửa được trong giao diện nếu đổi kho.
 */
export const KHO_TRONG: LuuGitHub = {
  chuSoHuu: 'Lordthad',
  kho: 'gia-pha',
  nhanh: 'main',
  thuMuc: 'public',
};

export function docKho(): LuuGitHub {
  try {
    const s = localStorage.getItem(KHOA_KHO);
    return s ? { ...KHO_TRONG, ...(JSON.parse(s) as Partial<LuuGitHub>) } : KHO_TRONG;
  } catch {
    return KHO_TRONG;
  }
}

export function luuKho(x: LuuGitHub): void {
  try {
    localStorage.setItem(KHOA_KHO, JSON.stringify(x));
  } catch {
    // Trình duyệt chặn lưu trữ; người dùng sẽ phải khai lại lần sau.
  }
}

export function xoaKho(): void {
  localStorage.removeItem(KHOA_KHO);
}

/** Cất mã truy cập, khoá bằng mã quản trị. */
export async function catToken(
  kho: LuuGitHub,
  token: string,
  maQuanTri: string,
): Promise<LuuGitHub> {
  const moi: LuuGitHub = { ...kho, tokenMaHoa: await maHoa(token, maQuanTri) };
  luuKho(moi);
  return moi;
}

/** Lấy lại mã truy cập bằng mã quản trị; sai mã thì trả undefined. */
export async function layToken(kho: LuuGitHub, maQuanTri: string): Promise<string | undefined> {
  if (!kho.tokenMaHoa) return undefined;
  try {
    return await giaiMa(kho.tokenMaHoa, maQuanTri);
  } catch {
    return undefined;
  }
}

/** Khoá lại mã truy cập bằng mã quản trị mới, dùng khi đổi mã. */
export async function doiKhoaToken(
  kho: LuuGitHub,
  maCu: string,
  maMoi: string,
): Promise<LuuGitHub | undefined> {
  const token = await layToken(kho, maCu);
  if (!token) return undefined;
  return catToken(kho, token, maMoi);
}

export function xoaToken(kho: LuuGitHub): LuuGitHub {
  const moi: LuuGitHub = { ...kho, tokenMaHoa: undefined };
  luuKho(moi);
  return moi;
}

export function daKhaiKho(kho: KhoGitHub): boolean {
  return Boolean(kho.chuSoHuu && kho.kho);
}

export function sanSangDay(cf: CauHinhGitHub): boolean {
  return daKhaiKho(cf) && Boolean(cf.token);
}

/* ---------------- Gọi API GitHub ---------------- */

function goc(cf: CauHinhGitHub): string {
  return `https://api.github.com/repos/${cf.chuSoHuu}/${cf.kho}`;
}

function dauVao(cf: CauHinhGitHub): HeadersInit {
  return {
    Authorization: `Bearer ${cf.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** Đổi thông báo lỗi của GitHub sang câu tiếng Việt dễ hiểu. */
async function loiGitHub(res: Response): Promise<Error> {
  let chiTiet = '';
  try {
    const j = (await res.json()) as { message?: string };
    chiTiet = j.message ?? '';
  } catch {
    chiTiet = '';
  }
  if (res.status === 401) return new Error('Mã truy cập sai hoặc đã hết hạn. Hãy tạo mã mới.');
  if (res.status === 403) {
    return new Error(
      'Mã truy cập không đủ quyền ghi vào kho này (cần quyền Contents: read & write).',
    );
  }
  if (res.status === 404) {
    return new Error('Không tìm thấy kho. Kiểm tra lại tên chủ kho và tên kho, hoặc quyền của mã.');
  }
  if (res.status === 409 || res.status === 422) {
    return new Error(
      'Trên mạng đã có bản mới hơn — có thể người khác vừa cập nhật. Hãy tải lại trang rồi nhập lại phần vừa sửa.',
    );
  }
  return new Error(`GitHub báo lỗi ${res.status}${chiTiet ? `: ${chiTiet}` : ''}`);
}

/** Thử kết nối và xem mã truy cập có quyền ghi không. */
export async function kiemTraKetNoi(cf: CauHinhGitHub): Promise<string> {
  const res = await fetch(goc(cf), { headers: dauVao(cf) });
  if (!res.ok) throw await loiGitHub(res);
  const kho = (await res.json()) as { full_name: string; permissions?: { push?: boolean } };
  if (kho.permissions && !kho.permissions.push) {
    throw new Error(
      'Mã truy cập chỉ đọc được, chưa ghi được. Hãy cấp quyền Contents: read & write.',
    );
  }
  return `Kết nối được tới kho ${kho.full_name}.`;
}

/** Lấy mã phiên bản (sha) của file đang có trên kho; chưa có thì trả undefined. */
async function shaHienTai(cf: CauHinhGitHub, duongDan: string): Promise<string | undefined> {
  const res = await fetch(
    `${goc(cf)}/contents/${encodeURI(duongDan)}?ref=${encodeURIComponent(cf.nhanh)}`,
    { headers: dauVao(cf) },
  );
  if (res.status === 404) return undefined;
  if (!res.ok) throw await loiGitHub(res);
  const j = (await res.json()) as { sha: string };
  return j.sha;
}

function chuSangBase64(chu: string): string {
  const byte = new TextEncoder().encode(chu);
  let s = '';
  for (const b of byte) s += String.fromCharCode(b);
  return btoa(s);
}

async function ghiTep(
  cf: CauHinhGitHub,
  duongDan: string,
  base64: string,
  thongDiep: string,
): Promise<void> {
  const sha = await shaHienTai(cf, duongDan);
  const res = await fetch(`${goc(cf)}/contents/${encodeURI(duongDan)}`, {
    method: 'PUT',
    headers: { ...dauVao(cf), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: thongDiep,
      content: base64,
      branch: cf.nhanh,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw await loiGitHub(res);
}

export type TienTrinh = (thongDiep: string) => void;

/**
 * Đẩy toàn bộ gia phả (và ảnh chưa có trên kho) lên GitHub.
 * `noiDungJson` là nội dung file giapha.json, đã mã hoá sẵn nếu có mã xem.
 */
export async function dayLenGitHub(
  cf: CauHinhGitHub,
  gp: GiaPha,
  noiDungJson: string,
  bao: TienTrinh = () => {},
): Promise<string> {
  const thuMuc = cf.thuMuc.replace(/^\/+|\/+$/g, '');
  const duongDanJson = `${thuMuc ? `${thuMuc}/` : ''}data/giapha.json`;
  const nhan = `Cập nhật gia phả: ${gp.nguoi.length} người (${new Date().toLocaleString('vi-VN')})`;

  bao('Đang gửi dữ liệu gia phả...');
  await ghiTep(cf, duongDanJson, chuSangBase64(noiDungJson), nhan);

  const anh = Object.entries(await moiAnh());
  let soAnhMoi = 0;
  for (const [duongDan, dataUrl] of anh) {
    const dich = `${thuMuc ? `${thuMuc}/` : ''}${duongDan}`;
    if (await shaHienTai(cf, dich)) continue; // Ảnh đã có trên kho thì bỏ qua.
    soAnhMoi++;
    bao(`Đang gửi ảnh ${soAnhMoi}...`);
    await ghiTep(cf, dich, dataUrl.split(',')[1] ?? '', `Thêm ảnh ${duongDan}`);
  }

  return (
    `Đã đưa lên GitHub: ${gp.nguoi.length} người` +
    `${soAnhMoi ? `, ${soAnhMoi} ảnh mới` : ''}. ` +
    'Website thường cập nhật sau khoảng 1–2 phút.'
  );
}
