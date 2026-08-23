import type { Person } from '../types/giapha';
import { anhChiEmCua, conCuaNguoi, namSinh, voChongCua, type ChiMuc } from './chiMuc';

/**
 * Ước chừng người này sinh vào khoảng năm nào, dựa vào những người xung quanh.
 *
 * Dùng khi trong họ không còn ai nhớ năm sinh dương lịch mà chỉ nhớ can chi:
 * can chi lặp lại 60 năm một lần, có khoảng ước chừng mới lần ra được năm thật.
 */

export interface KhoangNam {
  tu: number;
  den: number;
  /** Câu giải thích ngắn để người dùng biết phần mềm dựa vào đâu. */
  canCu: string;
}

/** Khoảng tuổi hợp lý giữa cha mẹ và con. */
const TUOI_LAM_CHA_ME_SOM = 16;
const TUOI_LAM_CHA_ME_MUON = 55;
/** Chênh lệch hợp lý giữa vợ chồng, hoặc giữa anh chị em. */
const CHENH_CUNG_DOI = 25;
/** Một đời trong họ thường cách nhau chừng này năm. */
const NAM_MOI_DOI = 30;

const NAM_NAY = new Date().getFullYear();
const MAC_DINH: KhoangNam = {
  tu: 1700,
  den: NAM_NAY,
  canCu: 'chưa có mốc nào để dựa, nên khoảng còn rộng',
};

function gon(tu: number, den: number, canCu: string): KhoangNam {
  return { tu: Math.max(1000, Math.round(tu)), den: Math.min(NAM_NAY, Math.round(den)), canCu };
}

/**
 * Đoán khoảng năm sinh. Lấy mốc chắc chắn nhất tìm được, theo thứ tự:
 * cha mẹ, rồi con, rồi vợ/chồng, rồi anh chị em, cuối cùng là số đời.
 */
export function uocKhoangNamSinh(ci: ChiMuc, p: Person): KhoangNam {
  const cha = p.chaId ? ci.byId.get(p.chaId) : undefined;
  const me = p.meId ? ci.byId.get(p.meId) : undefined;
  for (const cm of [cha, me]) {
    const n = namSinh(cm);
    if (n) {
      return gon(
        n + TUOI_LAM_CHA_ME_SOM,
        n + TUOI_LAM_CHA_ME_MUON,
        `dựa vào năm sinh ${n} của ${cm === cha ? 'cha' : 'mẹ'} (${cm!.hoTen})`,
      );
    }
  }

  const con = conCuaNguoi(ci, p.id)
    .map((c) => ({ c, n: namSinh(c) }))
    .filter((x): x is { c: Person; n: number } => x.n != null)
    .sort((a, b) => a.n - b.n)[0];
  if (con) {
    return gon(
      con.n - TUOI_LAM_CHA_ME_MUON,
      con.n - TUOI_LAM_CHA_ME_SOM,
      `dựa vào năm sinh ${con.n} của người con ${con.c.hoTen}`,
    );
  }

  for (const bd of voChongCua(ci, p.id)) {
    const n = namSinh(bd.nguoi);
    if (n) {
      return gon(
        n - CHENH_CUNG_DOI,
        n + CHENH_CUNG_DOI,
        `dựa vào năm sinh ${n} của ${bd.nguoi.gioiTinh === 'nu' ? 'vợ' : 'chồng'} (${bd.nguoi.hoTen})`,
      );
    }
  }

  for (const ae of anhChiEmCua(ci, p.id)) {
    const n = namSinh(ae);
    if (n) {
      return gon(
        n - CHENH_CUNG_DOI,
        n + CHENH_CUNG_DOI,
        `dựa vào năm sinh ${n} của anh chị em (${ae.hoTen})`,
      );
    }
  }

  // Không ai quanh đó có năm sinh: ước theo số đời so với người xa đời nhất đã biết năm.
  const doiNay = ci.doi.get(p.id);
  if (doiNay != null) {
    let moc: { doi: number; nam: number } | undefined;
    for (const k of ci.giaPha.nguoi) {
      const n = namSinh(k);
      const d = ci.doi.get(k.id);
      if (n && d != null && (!moc || Math.abs(d - doiNay) < Math.abs(moc.doi - doiNay))) {
        moc = { doi: d, nam: n };
      }
    }
    if (moc) {
      const uoc = moc.nam + (doiNay - moc.doi) * NAM_MOI_DOI;
      return gon(
        uoc - 40,
        uoc + 40,
        `ước theo số đời: đời ${doiNay}, cách mốc đời ${moc.doi} (năm ${moc.nam})`,
      );
    }
  }

  return MAC_DINH;
}

/** Khoảng năm mất: sau năm sinh, và trong quãng đời người. */
export function uocKhoangNamMat(ci: ChiMuc, p: Person): KhoangNam {
  const ns = namSinh(p);
  if (ns) return gon(ns, ns + 110, `dựa vào năm sinh ${ns} của chính người này`);
  const k = uocKhoangNamSinh(ci, p);
  return gon(k.tu, k.den + 110, `${k.canCu}, cộng thêm quãng đời người`);
}
