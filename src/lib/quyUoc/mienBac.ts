import type { GioiTinh } from '../../types/giapha';

/** Bên nội (qua đường cha) hay bên ngoại (qua đường mẹ). */
export type Ben = 'noi' | 'ngoai';

export interface TuXungHo {
  /** Cách gọi chính. */
  chinh: string;
  /** Cách gọi thay thế khi dữ liệu chưa đủ để chốt (ví dụ bác hay chú). */
  phu?: string;
  canhBao?: string;
}

/** Chuỗi hiển thị cho người dùng: "bác" hoặc "bác hoặc chú". */
export function hienThi(t: TuXungHo): string {
  return t.phu ? `${t.chinh} hoặc ${t.phu}` : t.chinh;
}

/** Thêm tiền tố (ông/bà/cụ...) và hậu tố (" họ") vào cả hai phương án. */
export function ghepTuChi(t: TuXungHo, tienTo = '', hauTo = ''): TuXungHo {
  const boc = (x: string) => `${tienTo ? tienTo + ' ' : ''}${x}${hauTo}`;
  return { chinh: boc(t.chinh), phu: t.phu ? boc(t.phu) : undefined, canhBao: t.canhBao };
}

/**
 * Bậc trên trực hệ: người ở trên `n` đời so với người đang nói.
 * n = 1 cha/mẹ, 2 ông/bà, 3 cụ, 4 kỵ, 5 tổ.
 */
export function bacTrenTrucHe(n: number, gioiTinh: GioiTinh, ben: Ben): string {
  const nam = gioiTinh !== 'nu';
  const hau = ben === 'noi' ? 'nội' : 'ngoại';
  switch (n) {
    case 1:
      return nam ? 'cha' : 'mẹ';
    case 2:
      return `${nam ? 'ông' : 'bà'} ${hau}`;
    case 3:
      return `cụ ${hau}`;
    case 4:
      return `kỵ ${hau}`;
    case 5:
      return 'tổ';
    default:
      return `tổ đời thứ ${n}`;
  }
}

/** Bậc dưới trực hệ: con, cháu, chắt, chút, chít. */
export function bacDuoiTrucHe(n: number): string {
  switch (n) {
    case 1:
      return 'con';
    case 2:
      return 'cháu';
    case 3:
      return 'chắt';
    case 4:
      return 'chút';
    case 5:
      return 'chít';
    default:
      return `hậu duệ đời thứ ${n}`;
  }
}

/** Bậc dưới trong quan hệ bàng hệ (chú gọi cháu, ông chú gọi cháu...). */
export function bacDuoiBangHe(chenh: number): string {
  if (chenh <= 2) return 'cháu';
  if (chenh === 3) return 'chắt';
  if (chenh === 4) return 'chút';
  return `cháu đời thứ ${chenh}`;
}

/**
 * Vai cơ bản của người trên trong quan hệ bàng hệ chênh 1 đời.
 * Miền Bắc: anh/chị của cha mẹ đều gọi là "bác"; em trai cha là "chú",
 * em gái cha là "cô", em trai mẹ là "cậu", em gái mẹ là "dì".
 */
export function vaiCoBan(gioiTinhTren: GioiTinh, ben: Ben, sinhTruoc?: boolean): TuXungHo {
  const nam = gioiTinhTren !== 'nu';
  const sau = ben === 'noi' ? (nam ? 'chú' : 'cô') : nam ? 'cậu' : 'dì';
  if (sinhTruoc === true) return { chinh: 'bác' };
  if (sinhTruoc === false) return { chinh: sau };
  return {
    chinh: 'bác',
    phu: sau,
    canhBao: `Chưa rõ ai sinh trước nên chưa chốt được là bác hay ${sau}. Hãy bổ sung năm sinh hoặc thứ tự sinh.`,
  };
}

/** Tiền tố cho quan hệ bàng hệ chênh từ 2 đời trở lên: ông/bà, cụ, kỵ, tổ. */
export function tienToBacTren(chenh: number, gioiTinh: GioiTinh): string {
  const nam = gioiTinh !== 'nu';
  switch (chenh) {
    case 2:
      return nam ? 'ông' : 'bà';
    case 3:
      return 'cụ';
    case 4:
      return 'kỵ';
    default:
      return 'tổ';
  }
}

/** Anh / chị / em, dựa vào giới tính và ai sinh trước. */
export function anhChiEm(gioiTinh: GioiTinh, sinhTruoc?: boolean): TuXungHo {
  const nam = gioiTinh !== 'nu';
  if (sinhTruoc === true) return { chinh: nam ? 'anh' : 'chị' };
  if (sinhTruoc === false) return { chinh: 'em' };
  return {
    chinh: nam ? 'anh' : 'chị',
    phu: 'em',
    canhBao: 'Chưa rõ ai sinh trước. Hãy bổ sung năm sinh hoặc thứ tự sinh.',
  };
}

/** Cách gọi anh chị em họ theo hai nhánh nội/ngoại. */
export function loaiAnhEmHo(benA: Ben, benB: Ben): string {
  if (benA === 'noi' && benB === 'noi') return 'con chú con bác';
  if (benA === 'ngoai' && benB === 'ngoai') return 'con dì';
  return 'con cô con cậu';
}

const DAU_RE: Record<string, { nam?: string; nu?: string }> = {
  cha: { nu: 'mẹ kế' },
  mẹ: { nam: 'bố dượng' },
  anh: { nu: 'chị dâu' },
  chị: { nam: 'anh rể' },
  em: { nu: 'em dâu', nam: 'em rể' },
  chú: { nu: 'thím' },
  bác: { nu: 'bác gái', nam: 'bác trai' },
  cô: { nam: 'chú' },
  cậu: { nu: 'mợ' },
  dì: { nam: 'chú' },
  con: { nu: 'con dâu', nam: 'con rể' },
  cháu: { nu: 'cháu dâu', nam: 'cháu rể' },
  chắt: { nu: 'chắt dâu', nam: 'chắt rể' },
  'ông nội': { nu: 'bà nội' },
  'bà nội': { nam: 'ông nội' },
  'ông ngoại': { nu: 'bà ngoại' },
  'bà ngoại': { nam: 'ông ngoại' },
};

/**
 * Từ quan hệ huyết thống `tuGoc` (cách gọi người trong họ), suy ra cách gọi
 * vợ hoặc chồng của người đó. `gioiTinhBanDoi` là giới tính của người kết hôn vào họ.
 */
export function tuDauRe(tuGoc: string, gioiTinhBanDoi: GioiTinh): TuXungHo {
  const nam = gioiTinhBanDoi !== 'nu';
  const goc = tuGoc.replace(/ họ$/, '');
  const ho = tuGoc.endsWith(' họ') ? ' họ' : '';
  const bang = DAU_RE[goc];
  const tim = bang ? (nam ? bang.nam : bang.nu) : undefined;
  if (tim) {
    const canhBao =
      (goc === 'cô' || goc === 'dì') && nam
        ? `Nhiều nơi gọi chồng của ${goc} là "dượng".`
        : undefined;
    return { chinh: tim + ho, canhBao };
  }
  return { chinh: `${nam ? 'chồng' : 'vợ'} của ${tuGoc}` };
}
