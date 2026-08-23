import type { GiaPha, GoiMaHoa } from '../types/giapha';
import { giaiMa, laGoiMaHoa, maHoa } from './baoMat';

const KHOA_MAT_KHAU = 'gia-pha:mat-khau';

const KHOA_NHAP = 'gia-pha:ban-nhap';
const KHOA_ANH = 'gia-pha-anh';

/* ---------------- Ảnh lưu trong IndexedDB ---------------- */

function moKho(): Promise<IDBDatabase> {
  return new Promise((ok, loi) => {
    const yc = indexedDB.open(KHOA_ANH, 1);
    yc.onupgradeneeded = () => {
      if (!yc.result.objectStoreNames.contains('anh')) yc.result.createObjectStore('anh');
    };
    yc.onsuccess = () => ok(yc.result);
    yc.onerror = () => loi(yc.error);
  });
}

async function thaoTac<T>(
  che: IDBTransactionMode,
  viec: (kho: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await moKho();
  return new Promise<T>((ok, loi) => {
    const gd = db.transaction('anh', che);
    const yc = viec(gd.objectStore('anh'));
    yc.onsuccess = () => ok(yc.result);
    yc.onerror = () => loi(yc.error);
    gd.oncomplete = () => db.close();
  });
}

/** Lưu một ảnh dưới dạng data URL, khoá là đường dẫn kiểu "media/abc.jpg". */
export async function luuAnh(duongDan: string, dataUrl: string): Promise<void> {
  await thaoTac('readwrite', (kho) => kho.put(dataUrl, duongDan));
}

export async function layAnh(duongDan: string): Promise<string | undefined> {
  try {
    return await thaoTac<string | undefined>('readonly', (kho) => kho.get(duongDan));
  } catch {
    return undefined;
  }
}

export async function moiAnh(): Promise<Record<string, string>> {
  try {
    const khoa = await thaoTac<IDBValidKey[]>('readonly', (kho) => kho.getAllKeys());
    const gt = await thaoTac<string[]>('readonly', (kho) => kho.getAll());
    const kq: Record<string, string> = {};
    khoa.forEach((k, i) => {
      kq[String(k)] = gt[i];
    });
    return kq;
  } catch {
    return {};
  }
}

/** Nén ảnh về chiều dài cạnh tối đa `canh` px rồi trả về data URL. */
export function nenAnh(file: File, canh = 1200, chatLuong = 0.82): Promise<string> {
  return new Promise((ok, loi) => {
    const doc = new FileReader();
    doc.onerror = () => loi(doc.error);
    doc.onload = () => {
      const img = new Image();
      img.onerror = () => loi(new Error('Không đọc được ảnh'));
      img.onload = () => {
        const ty = Math.min(1, canh / Math.max(img.width, img.height));
        const w = Math.round(img.width * ty);
        const h = Math.round(img.height * ty);
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d');
        if (!ctx) return loi(new Error('Trình duyệt không hỗ trợ canvas'));
        ctx.drawImage(img, 0, 0, w, h);
        ok(cv.toDataURL('image/jpeg', chatLuong));
      };
      img.src = String(doc.result);
    };
    doc.readAsDataURL(file);
  });
}

/* ---------------- Dữ liệu gia phả ---------------- */

export function luuBanNhap(gp: GiaPha): void {
  try {
    localStorage.setItem(KHOA_NHAP, JSON.stringify(gp));
  } catch {
    // Bộ nhớ đầy hoặc trình duyệt chặn — bỏ qua, dữ liệu vẫn còn trong bộ nhớ tạm.
  }
}

export function docBanNhap(): GiaPha | undefined {
  try {
    const s = localStorage.getItem(KHOA_NHAP);
    return s ? (JSON.parse(s) as GiaPha) : undefined;
  } catch {
    return undefined;
  }
}

export function xoaBanNhap(): void {
  localStorage.removeItem(KHOA_NHAP);
}

/**
 * Đường dẫn tới file dữ liệu, kèm mốc thời gian để không dính bộ nhớ đệm.
 * GitHub Pages đặt sẵn `Cache-Control: max-age=600` và không đọc file
 * `public/_headers`, nên không chặn đệm ở đây thì cập nhật xong cả họ vẫn có
 * thể thấy bản cũ suốt mười phút.
 */
export function duongDanDuLieu(ten: string): string {
  return `${import.meta.env.BASE_URL}data/${ten}?t=${Date.now()}`;
}

export interface KetQuaNap {
  giaPha?: GiaPha;
  tuBanNhap: boolean;
  /** File dữ liệu đang được mã hoá, cần mật khẩu xem mới mở được. */
  goiMaHoa?: GoiMaHoa;
  /** Mốc cập nhật của file trên mạng, để so xem bản nháp trong máy có cũ hơn không. */
  capNhatTrenMang?: string;
}

/** Mật khẩu xem đã ghi nhớ trên máy này (nếu người dùng chọn nhớ). */
export function matKhauDaNho(): string | undefined {
  return sessionStorage.getItem(KHOA_MAT_KHAU) ?? localStorage.getItem(KHOA_MAT_KHAU) ?? undefined;
}

export function nhoMatKhau(mk: string, lauDai: boolean): void {
  try {
    (lauDai ? localStorage : sessionStorage).setItem(KHOA_MAT_KHAU, mk);
  } catch {
    // Trình duyệt chặn lưu trữ — vẫn dùng được, chỉ là mở lại phải nhập lại.
  }
}

export function quenMatKhau(): void {
  sessionStorage.removeItem(KHOA_MAT_KHAU);
  localStorage.removeItem(KHOA_MAT_KHAU);
}

/**
 * Nạp gia phả: ưu tiên bản nháp đang sửa, không có thì lấy file dữ liệu gốc.
 * Dù đang có bản nháp vẫn hỏi file trên mạng, để biết người khác đã cập nhật
 * gì mới hơn hay chưa — nếu không thì bản nháp cũ sẽ che mất việc của họ.
 */
export async function napGiaPha(): Promise<KetQuaNap> {
  const nhap = docBanNhap();

  let noiDung: unknown;
  let loiTai: string | undefined;
  try {
    const res = await fetch(duongDanDuLieu('giapha.json'));
    if (res.ok) noiDung = await res.json();
    else loiTai = `Không đọc được file dữ liệu (${res.status})`;
  } catch (e) {
    loiTai = e instanceof Error ? e.message : String(e);
  }

  const capNhatTrenMang = laGoiMaHoa(noiDung)
    ? noiDung.capNhat
    : (noiDung as GiaPha | undefined)?.capNhat;

  // Đang sửa dở thì giữ nguyên việc của người dùng, chỉ kèm mốc trên mạng để đối chiếu.
  if (nhap) return { giaPha: nhap, tuBanNhap: true, capNhatTrenMang };

  if (noiDung === undefined) throw new Error(loiTai ?? 'Không đọc được file dữ liệu');

  if (laGoiMaHoa(noiDung)) {
    const daNho = matKhauDaNho();
    if (daNho) {
      try {
        return {
          giaPha: JSON.parse(await giaiMa(noiDung, daNho)) as GiaPha,
          tuBanNhap: false,
          capNhatTrenMang,
        };
      } catch {
        quenMatKhau();
      }
    }
    return { tuBanNhap: false, goiMaHoa: noiDung, capNhatTrenMang };
  }
  return { giaPha: noiDung as GiaPha, tuBanNhap: false, capNhatTrenMang };
}

/** Mở khoá gói dữ liệu đã mã hoá; mật khẩu sai sẽ ném MatKhauSai. */
export async function moKhoaGiaPha(goi: GoiMaHoa, matKhau: string): Promise<GiaPha> {
  return JSON.parse(await giaiMa(goi, matKhau)) as GiaPha;
}

/* ---------------- Xuất / nhập ---------------- */

function taiVe(ten: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ten;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nội dung file giapha.json sẽ đưa lên mạng: mã hoá sẵn nếu đã đặt mật khẩu xem. */
export async function noiDungXuat(gp: GiaPha, matKhau?: string): Promise<string> {
  const luc = new Date().toISOString();
  const tho = JSON.stringify({ ...gp, capNhat: luc }, null, 2);
  if (!matKhau) return tho;
  return JSON.stringify(await maHoa(tho, matKhau, luc), null, 2);
}

export async function xuatJson(gp: GiaPha, matKhau?: string): Promise<void> {
  const noiDung = await noiDungXuat(gp, matKhau);
  taiVe('giapha.json', new Blob([noiDung], { type: 'application/json' }));
}

function dataUrlSangBlob(dataUrl: string): Blob {
  const [dau, duLieu] = dataUrl.split(',');
  const kieu = /:(.*?);/.exec(dau)?.[1] ?? 'image/jpeg';
  const nhiPhan = atob(duLieu);
  const mang = new Uint8Array(nhiPhan.length);
  for (let i = 0; i < nhiPhan.length; i++) mang[i] = nhiPhan.charCodeAt(i);
  return new Blob([mang], { type: kieu });
}

/** Xuất trọn bộ: giapha.json + thư mục media, đóng thành một file zip. */
export async function xuatZip(gp: GiaPha, matKhau?: string): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('data/giapha.json', await noiDungXuat(gp, matKhau));
  const anh = await moiAnh();
  for (const [duongDan, dataUrl] of Object.entries(anh)) {
    zip.file(duongDan, dataUrlSangBlob(dataUrl));
  }
  zip.file(
    'HUONG-DAN.txt',
    [
      'Nội dung file nén này chính là thư mục public/ của phần mềm gia phả.',
      '',
      'Cách cập nhật website:',
      '1. Giải nén file này.',
      '2. Chép đè thư mục data/ và media/ vào thư mục public/ của mã nguồn.',
      '3. Chạy lệnh: npm run build',
      '4. Đưa thư mục dist/ lên nơi lưu trữ website.',
      '',
      matKhau
        ? 'File data/giapha.json đã được mã hoá bằng mật khẩu xem. Người không có mật khẩu tải về cũng không đọc được.'
        : 'CẢNH BÁO: dữ liệu chưa mã hoá, ai vào website cũng đọc được toàn bộ gia phả.',
      '',
      `Xuất lúc: ${new Date().toLocaleString('vi-VN')}`,
    ].join('\n'),
  );
  taiVe('gia-pha-du-lieu.zip', await zip.generateAsync({ type: 'blob' }));
}

function phanTich(chu: string, matKhau?: string): Promise<GiaPha> {
  const noiDung: unknown = JSON.parse(chu);
  if (!laGoiMaHoa(noiDung)) return Promise.resolve(noiDung as GiaPha);
  if (!matKhau) throw new Error('File này đã được mã hoá, cần nhập mật khẩu xem để mở');
  return giaiMa(noiDung, matKhau).then((x) => JSON.parse(x) as GiaPha);
}

/** Đọc file người dùng chọn: nhận cả .json lẫn .zip, kể cả file đã mã hoá. */
export async function docFileGiaPha(file: File, matKhau?: string): Promise<GiaPha> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(file);
    const mucJson =
      zip.file('data/giapha.json') ?? zip.file('giapha.json') ?? zip.file(/giapha\.json$/)[0];
    if (!mucJson) throw new Error('Trong file nén không có giapha.json');
    const gp = await phanTich(await mucJson.async('string'), matKhau);
    for (const [duongDan, muc] of Object.entries(zip.files)) {
      if (muc.dir || !/^media\//.test(duongDan)) continue;
      const b64 = await muc.async('base64');
      const duoi = duongDan.split('.').pop()?.toLowerCase();
      const kieu = duoi === 'png' ? 'image/png' : duoi === 'webp' ? 'image/webp' : 'image/jpeg';
      await luuAnh(duongDan, `data:${kieu};base64,${b64}`);
    }
    return gp;
  }
  return phanTich(await file.text(), matKhau);
}

/* ---------------- Ghi thẳng vào thư mục (Chrome/Edge trên máy tính) ---------------- */

export function hoTroGhiThuMuc(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

interface ThuMuc {
  getDirectoryHandle(ten: string, tuyChon?: { create?: boolean }): Promise<ThuMuc>;
  getFileHandle(ten: string, tuyChon?: { create?: boolean }): Promise<{
    createWritable(): Promise<{ write(d: unknown): Promise<void>; close(): Promise<void> }>;
  }>;
}

/**
 * Ghi thẳng giapha.json và ảnh vào thư mục public/ của mã nguồn.
 * Người dùng chọn thư mục một lần trong hộp thoại của trình duyệt.
 */
export async function ghiVaoThuMuc(gp: GiaPha, matKhau?: string): Promise<string> {
  const chon = (window as unknown as { showDirectoryPicker: () => Promise<ThuMuc> }).showDirectoryPicker;
  const goc = await chon();
  const thuMucData = await goc.getDirectoryHandle('data', { create: true });
  const fJson = await thuMucData.getFileHandle('giapha.json', { create: true });
  const w = await fJson.createWritable();
  await w.write(await noiDungXuat(gp, matKhau));
  await w.close();

  const anh = await moiAnh();
  let soAnh = 0;
  if (Object.keys(anh).length) {
    const thuMucMedia = await goc.getDirectoryHandle('media', { create: true });
    for (const [duongDan, dataUrl] of Object.entries(anh)) {
      const ten = duongDan.replace(/^media\//, '');
      const f = await thuMucMedia.getFileHandle(ten, { create: true });
      const ws = await f.createWritable();
      await ws.write(dataUrlSangBlob(dataUrl));
      await ws.close();
      soAnh++;
    }
  }
  return (
    `Đã ghi giapha.json${soAnh ? ` và ${soAnh} ảnh` : ''} vào thư mục đã chọn` +
    `${matKhau ? ' (đã mã hoá bằng mật khẩu xem).' : '. Dữ liệu CHƯA mã hoá.'}`
  );
}

/** Sinh mã người mới không trùng. */
export function maMoi(daCo: Iterable<string>, tienTo = 'P'): string {
  let max = 0;
  for (const id of daCo) {
    const m = new RegExp(`^${tienTo}(\\d+)$`).exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${tienTo}${String(max + 1).padStart(3, '0')}`;
}
