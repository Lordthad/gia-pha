import type { GiaPha, HonNhan, ID, Person } from '../types/giapha';

/** Chỉ mục tra cứu nhanh, dựng một lần mỗi khi dữ liệu thay đổi. */
export interface ChiMuc {
  giaPha: GiaPha;
  byId: Map<ID, Person>;
  /** id cha hoặc mẹ -> danh sách con (đã sắp xếp theo thứ tự sinh) */
  conCua: Map<ID, ID[]>;
  /** id -> các cuộc hôn nhân liên quan */
  honNhanCua: Map<ID, HonNhan[]>;
  /** id -> đời trong họ (1 = thuỷ tổ) */
  doi: Map<ID, number>;
  /** đời -> danh sách id */
  theoDoi: Map<number, ID[]>;
}

/** Lấy năm (dương lịch) từ một mốc thời gian, nếu suy ra được. */
export function layNam(nt?: { duong?: string; am?: { nam?: number } }): number | undefined {
  if (!nt) return undefined;
  if (nt.duong) {
    const m = /^(\d{3,4})/.exec(nt.duong);
    if (m) return Number(m[1]);
  }
  if (nt.am?.nam) return nt.am.nam;
  return undefined;
}

export function namSinh(p?: Person): number | undefined {
  return layNam(p?.sinh);
}

export function namMat(p?: Person): number | undefined {
  return layNam(p?.mat);
}

/** Người đã mất chưa? Có ngày mất hoặc ngày giỗ thì coi là đã mất. */
export function daMat(p: Person): boolean {
  return Boolean(p.mat || p.gioAm);
}

export function chaMeIds(p?: Person): ID[] {
  if (!p) return [];
  return [p.chaId, p.meId].filter((x): x is ID => Boolean(x));
}

/**
 * Thứ tự cuộc hôn nhân sinh ra người này: 1 = con vợ cả, 2 = con vợ hai...
 * Trả về undefined khi không tra được (thiếu cha, thiếu mẹ, hoặc chưa ghi hôn nhân).
 */
function thuTuDongVo(honNhanCua: Map<ID, HonNhan[]>, p: Person): number | undefined {
  if (!p.chaId || !p.meId) return undefined;
  const hn = (honNhanCua.get(p.chaId) ?? []).find(
    (h) => h.voId === p.meId || h.chongId === p.meId,
  );
  return hn?.thuTu;
}

/** Thứ tự dòng vợ của một người trong họ (1 = con vợ cả). */
export function thuTuDongVoCua(ci: ChiMuc, p?: Person): number | undefined {
  return p ? thuTuDongVo(ci.honNhanCua, p) : undefined;
}

/**
 * So sánh thứ bậc hai anh chị em.
 * Theo lệ dòng họ, con vợ cả luôn ở vai anh/chị so với con vợ thứ, dù sinh sau.
 * Cùng một mẹ thì xét thứ tự sinh, rồi năm sinh, rồi tên.
 */
export function taoSoSanhAnhEm(
  honNhanCua: Map<ID, HonNhan[]>,
): (a: Person, b: Person) => number {
  return (a, b) => {
    if (a.chaId && a.chaId === b.chaId && a.meId !== b.meId) {
      const va = thuTuDongVo(honNhanCua, a);
      const vb = thuTuDongVo(honNhanCua, b);
      if (va != null && vb != null && va !== vb) return va - vb;
    }
    const ta = a.thuTu ?? Number.POSITIVE_INFINITY;
    const tb = b.thuTu ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    const na = namSinh(a) ?? Number.POSITIVE_INFINITY;
    const nb = namSinh(b) ?? Number.POSITIVE_INFINITY;
    if (na !== nb) return na - nb;
    return a.hoTen.localeCompare(b.hoTen, 'vi');
  };
}

export function dungChiMuc(giaPha: GiaPha): ChiMuc {
  const byId = new Map<ID, Person>();
  for (const p of giaPha.nguoi) byId.set(p.id, p);

  const conCua = new Map<ID, ID[]>();
  const them = (cha: ID | null | undefined, con: ID) => {
    if (!cha || !byId.has(cha)) return;
    const ds = conCua.get(cha);
    if (ds) ds.push(con);
    else conCua.set(cha, [con]);
  };
  for (const p of giaPha.nguoi) {
    them(p.chaId, p.id);
    them(p.meId, p.id);
  }
  // Dựng hôn nhân trước vì thứ tự anh em phụ thuộc vào thứ tự dòng vợ.
  const honNhanCua = new Map<ID, HonNhan[]>();
  for (const hn of giaPha.honNhan) {
    for (const id of [hn.chongId, hn.voId]) {
      if (!byId.has(id)) continue;
      const ds = honNhanCua.get(id);
      if (ds) ds.push(hn);
      else honNhanCua.set(id, [hn]);
    }
  }
  for (const [, ds] of honNhanCua) ds.sort((a, b) => (a.thuTu ?? 99) - (b.thuTu ?? 99));

  const soSanhAnhEm = taoSoSanhAnhEm(honNhanCua);
  for (const [, ds] of conCua) {
    ds.sort((x, y) => soSanhAnhEm(byId.get(x)!, byId.get(y)!));
  }

  const doi = tinhDoi(giaPha, byId, conCua, honNhanCua);
  const theoDoi = new Map<number, ID[]>();
  for (const [id, d] of doi) {
    const ds = theoDoi.get(d);
    if (ds) ds.push(id);
    else theoDoi.set(d, [id]);
  }
  for (const [, ds] of theoDoi) {
    ds.sort((x, y) => byId.get(x)!.hoTen.localeCompare(byId.get(y)!.hoTen, 'vi'));
  }

  return { giaPha, byId, conCua, honNhanCua, doi, theoDoi };
}

/**
 * Tính số đời cho từng người.
 * Gieo từ thuỷ tổ (đời 1) rồi lan xuống con, lên cha mẹ và ngang qua vợ/chồng.
 * Nhánh nào chưa nối vào cây chính thì lấy người trên cùng của nhánh đó làm đời 1.
 */
function tinhDoi(
  giaPha: GiaPha,
  byId: Map<ID, Person>,
  conCua: Map<ID, ID[]>,
  honNhanCua: Map<ID, HonNhan[]>,
): Map<ID, number> {
  const doi = new Map<ID, number>();

  const lan = (goc: ID, giaTri: number) => {
    const hangDoi: Array<[ID, number]> = [[goc, giaTri]];
    while (hangDoi.length) {
      const [id, d] = hangDoi.shift()!;
      if (doi.has(id)) continue;
      doi.set(id, d);
      const p = byId.get(id);
      if (!p) continue;
      for (const con of conCua.get(id) ?? []) if (!doi.has(con)) hangDoi.push([con, d + 1]);
      for (const cm of chaMeIds(p)) if (!doi.has(cm)) hangDoi.push([cm, d - 1]);
      for (const hn of honNhanCua.get(id) ?? []) {
        const kia = hn.chongId === id ? hn.voId : hn.chongId;
        if (byId.has(kia) && !doi.has(kia)) hangDoi.push([kia, d]);
      }
    }
  };

  const thuyTo = giaPha.dongHo.thuyToId;
  if (thuyTo && byId.has(thuyTo)) lan(thuyTo, 1);

  // Các nhánh còn lại: tìm người trên cùng rồi gieo đời 1.
  for (const p of giaPha.nguoi) {
    if (doi.has(p.id)) continue;
    let tren = p;
    const daQua = new Set<ID>([p.id]);
    while (true) {
      const cha = tren.chaId ? byId.get(tren.chaId) : undefined;
      const me = tren.meId ? byId.get(tren.meId) : undefined;
      const kt = cha ?? me;
      if (!kt || daQua.has(kt.id)) break;
      daQua.add(kt.id);
      tren = kt;
    }
    lan(tren.id, 1);
  }

  // Chuẩn hoá để đời nhỏ nhất là 1.
  let min = Number.POSITIVE_INFINITY;
  for (const d of doi.values()) min = Math.min(min, d);
  if (Number.isFinite(min) && min !== 1) {
    for (const [id, d] of doi) doi.set(id, d - min + 1);
  }
  return doi;
}

/* ---------- Truy vấn quan hệ ---------- */

export function chaCua(ci: ChiMuc, id: ID): Person | undefined {
  const cha = ci.byId.get(id)?.chaId;
  return cha ? ci.byId.get(cha) : undefined;
}

export function meCua(ci: ChiMuc, id: ID): Person | undefined {
  const me = ci.byId.get(id)?.meId;
  return me ? ci.byId.get(me) : undefined;
}

export function conCuaNguoi(ci: ChiMuc, id: ID): Person[] {
  return (ci.conCua.get(id) ?? []).map((x) => ci.byId.get(x)!).filter(Boolean);
}

export interface BanDoi {
  nguoi: Person;
  honNhan: HonNhan;
}

export function voChongCua(ci: ChiMuc, id: ID): BanDoi[] {
  return (ci.honNhanCua.get(id) ?? [])
    .map((hn) => {
      const kia = hn.chongId === id ? hn.voId : hn.chongId;
      const nguoi = ci.byId.get(kia);
      return nguoi ? { nguoi, honNhan: hn } : undefined;
    })
    .filter((x): x is BanDoi => Boolean(x));
}

/** Anh chị em: chung cha hoặc chung mẹ. Trả về đã sắp theo thứ tự sinh. */
export function anhChiEmCua(ci: ChiMuc, id: ID): Person[] {
  const p = ci.byId.get(id);
  if (!p) return [];
  const ids = new Set<ID>();
  for (const cm of chaMeIds(p)) for (const c of ci.conCua.get(cm) ?? []) ids.add(c);
  ids.delete(id);
  return [...ids].map((x) => ci.byId.get(x)!).sort(taoSoSanhAnhEm(ci.honNhanCua));
}

/** Tên hiển thị đầy đủ, kèm tên thường gọi nếu có. */
export function tenDayDu(p: Person): string {
  return p.tenThuong ? `${p.hoTen} (${p.tenThuong})` : p.hoTen;
}

/** Chuỗi năm sinh–năm mất để hiển thị dưới tên. */
export function khoangNam(p: Person): string {
  const s = namSinh(p);
  const m = namMat(p);
  if (s && m) return `${s} – ${m}`;
  if (s) return daMat(p) ? `${s} – ?` : `sinh ${s}`;
  if (m) return `? – ${m}`;
  return '';
}
