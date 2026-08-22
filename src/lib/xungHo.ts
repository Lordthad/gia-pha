import type { ID, Person } from '../types/giapha';
import { namSinh, tenDayDu, thuTuDongVoCua, type ChiMuc } from './chiMuc';
import * as QU from './quyUoc/mienBac';

export type LoaiBuoc = 'cha' | 'me';

export interface BuocDuong {
  id: ID;
  hoTen: string;
  /** Quan hệ với người đứng ngay trước trong đường đi. */
  quanHe: string;
}

export type LoaiQuanHe = 'chinh-minh' | 'huyet-thong' | 'hon-nhan' | 'khong-ro';

export interface KetQuaXungHo {
  loai: LoaiQuanHe;
  /** A gọi B là gì. */
  AgoiB: string;
  /** B gọi A là gì. */
  BgoiA: string;
  /** > 0 nghĩa là A ở vai trên B bấy nhiêu đời. */
  chenhDoi: number;
  /** Câu tóm tắt vai vế. */
  vaiVe: string;
  doiA?: number;
  doiB?: number;
  toChung?: Person;
  duongDi: BuocDuong[];
  giaiThich: string;
  canhBao: string[];
}

/* ---------------- Tìm tổ tiên ---------------- */

interface DuongLen {
  buoc: number;
  /** Các nút từ chính người đó lên tới tổ tiên: [id, ..., toTien] */
  nut: ID[];
  /** Mỗi bước đi qua đường cha hay đường mẹ. */
  cacBuoc: LoaiBuoc[];
}

/** Toàn bộ tổ tiên (kể cả chính mình, bước 0) kèm đường đi ngắn nhất. */
export function toTienCua(ci: ChiMuc, id: ID): Map<ID, DuongLen> {
  const kq = new Map<ID, DuongLen>();
  if (!ci.byId.has(id)) return kq;
  const hangDoi: DuongLen[] = [{ buoc: 0, nut: [id], cacBuoc: [] }];
  while (hangDoi.length) {
    const d = hangDoi.shift()!;
    const cuoi = d.nut[d.nut.length - 1];
    if (kq.has(cuoi)) continue;
    kq.set(cuoi, d);
    const p = ci.byId.get(cuoi);
    if (!p) continue;
    if (p.chaId && ci.byId.has(p.chaId) && !kq.has(p.chaId)) {
      hangDoi.push({ buoc: d.buoc + 1, nut: [...d.nut, p.chaId], cacBuoc: [...d.cacBuoc, 'cha'] });
    }
    if (p.meId && ci.byId.has(p.meId) && !kq.has(p.meId)) {
      hangDoi.push({ buoc: d.buoc + 1, nut: [...d.nut, p.meId], cacBuoc: [...d.cacBuoc, 'me'] });
    }
  }
  return kq;
}

interface ToChung {
  id: ID;
  a: DuongLen;
  b: DuongLen;
}

/** Tổ chung gần nhất; hoà nhau thì ưu tiên đường bên nội (qua cha). */
function timToChung(ta: Map<ID, DuongLen>, tb: Map<ID, DuongLen>): ToChung | undefined {
  let tot: ToChung | undefined;
  let diemTot = Number.POSITIVE_INFINITY;
  let meTot = Number.POSITIVE_INFINITY;
  for (const [id, a] of ta) {
    const b = tb.get(id);
    if (!b) continue;
    const diem = a.buoc + b.buoc;
    const soMe =
      a.cacBuoc.filter((x) => x === 'me').length + b.cacBuoc.filter((x) => x === 'me').length;
    if (diem < diemTot || (diem === diemTot && soMe < meTot)) {
      tot = { id, a, b };
      diemTot = diem;
      meTot = soMe;
    }
  }
  return tot;
}

/* ---------------- So sánh tuổi / thứ tự ---------------- */

/**
 * true nếu x ở vai trên y trong hàng anh em, false nếu dưới, undefined nếu chưa xác định.
 * Cùng cha khác mẹ thì theo lệ họ: con vợ cả là anh/chị của con vợ thứ, dù sinh sau.
 */
export function aiSinhTruoc(ci: ChiMuc, xId: ID, yId: ID): boolean | undefined {
  const x = ci.byId.get(xId);
  const y = ci.byId.get(yId);
  if (!x || !y) return undefined;
  const chungCha = Boolean(x.chaId && x.chaId === y.chaId);
  const chungMe = Boolean(x.meId && x.meId === y.meId);
  if (chungCha && !chungMe) {
    const vx = thuTuDongVoCua(ci, x);
    const vy = thuTuDongVoCua(ci, y);
    if (vx != null && vy != null && vx !== vy) return vx < vy;
  }
  if ((chungCha || chungMe) && x.thuTu != null && y.thuTu != null && x.thuTu !== y.thuTu) {
    return x.thuTu < y.thuTu;
  }
  const nx = namSinh(x);
  const ny = namSinh(y);
  if (nx != null && ny != null && nx !== ny) return nx < ny;
  if (x.thuTu != null && y.thuTu != null && x.thuTu !== y.thuTu) return x.thuTu < y.thuTu;
  return undefined;
}

function benTu(cacBuoc: LoaiBuoc[]): QU.Ben {
  return cacBuoc[0] === 'me' ? 'ngoai' : 'noi';
}

function dao(x: boolean | undefined): boolean | undefined {
  return x === undefined ? undefined : !x;
}

/* ---------------- Quan hệ huyết thống ---------------- */

interface KetQuaHuyet {
  AgoiB: QU.TuXungHo;
  BgoiA: QU.TuXungHo;
  chenhDoi: number;
  toChungId: ID;
  nutA: ID[];
  nutB: ID[];
  cacBuocA: LoaiBuoc[];
  cacBuocB: LoaiBuoc[];
  moTa: string;
  canhBao: string[];
}

/**
 * So thứ bậc hai nhánh tại điểm rẽ: hai người con của tổ chung trên mỗi đường đi.
 * Đây là căn cứ truyền thống để phân biệt bác (nhánh sinh trước) với chú/cô/cậu/dì.
 * Trả về true nếu nhánh của A sinh trước nhánh của B.
 */
function nhanhAiTruoc(ci: ChiMuc, tc: ToChung, a: number, b: number): boolean | undefined {
  if (a < 1 || b < 1) return undefined;
  const nhanhA = tc.a.nut[a - 1];
  const nhanhB = tc.b.nut[b - 1];
  if (nhanhA === nhanhB) return undefined;
  return aiSinhTruoc(ci, nhanhA, nhanhB);
}

/** Quan hệ máu mủ giữa hai người; trả về undefined nếu không có tổ chung. */
function quanHeHuyetThong(ci: ChiMuc, idA: ID, idB: ID): KetQuaHuyet | undefined {
  const A = ci.byId.get(idA);
  const B = ci.byId.get(idB);
  if (!A || !B) return undefined;
  const tc = timToChung(toTienCua(ci, idA), toTienCua(ci, idB));
  if (!tc) return undefined;

  const a = tc.a.buoc;
  const b = tc.b.buoc;
  const chung = {
    toChungId: tc.id,
    nutA: tc.a.nut,
    nutB: tc.b.nut,
    cacBuocA: tc.a.cacBuoc,
    cacBuocB: tc.b.cacBuoc,
  };
  const canhBao: string[] = [];
  const gom = (t: QU.TuXungHo) => {
    if (t.canhBao && !canhBao.includes(t.canhBao)) canhBao.push(t.canhBao);
    return t;
  };

  // Trực hệ: A là tổ tiên của B
  if (a === 0 && b > 0) {
    const ben = benTu(tc.b.cacBuoc);
    const BgoiA: QU.TuXungHo = { chinh: QU.bacTrenTrucHe(b, A.gioiTinh, ben) };
    const AgoiB: QU.TuXungHo = { chinh: QU.bacDuoiTrucHe(b) };
    return {
      ...chung,
      AgoiB,
      BgoiA,
      chenhDoi: b,
      moTa: `${tenDayDu(A)} là ${BgoiA.chinh} của ${tenDayDu(B)}, thuộc dòng trực hệ cách ${b} đời.`,
      canhBao,
    };
  }

  // Trực hệ: B là tổ tiên của A
  if (b === 0 && a > 0) {
    const ben = benTu(tc.a.cacBuoc);
    const AgoiB: QU.TuXungHo = { chinh: QU.bacTrenTrucHe(a, B.gioiTinh, ben) };
    const BgoiA: QU.TuXungHo = { chinh: QU.bacDuoiTrucHe(a) };
    return {
      ...chung,
      AgoiB,
      BgoiA,
      chenhDoi: -a,
      moTa: `${tenDayDu(B)} là ${AgoiB.chinh} của ${tenDayDu(A)}, thuộc dòng trực hệ cách ${a} đời.`,
      canhBao,
    };
  }

  const benA = benTu(tc.a.cacBuoc);
  const benB = benTu(tc.b.cacBuoc);
  const chenh = b - a;

  // Cùng đời
  if (chenh === 0) {
    const truocA = nhanhAiTruoc(ci, tc, a, b) ?? aiSinhTruoc(ci, idA, idB);
    const hauTo = a === 1 ? '' : ' họ';
    const AgoiB = gom(QU.ghepTuChi(QU.anhChiEm(B.gioiTinh, dao(truocA)), '', hauTo));
    const BgoiA = gom(QU.ghepTuChi(QU.anhChiEm(A.gioiTinh, truocA), '', hauTo));
    let moTa: string;
    if (a === 1) {
      const cungCha = Boolean(A.chaId && A.chaId === B.chaId);
      const cungMe = Boolean(A.meId && A.meId === B.meId);
      if (cungCha && cungMe) {
        moTa = 'Hai người là anh chị em ruột.';
      } else if (cungCha) {
        moTa = 'Hai người là anh chị em cùng cha khác mẹ.';
        const vA = thuTuDongVoCua(ci, A);
        const vB = thuTuDongVoCua(ci, B);
        if (vA != null && vB != null && vA !== vB) {
          const tren = vA < vB ? A : B;
          const duoi = vA < vB ? B : A;
          moTa +=
            ` Theo lệ họ, con vợ cả ở vai anh/chị so với con vợ thứ, nên ${tren.hoTen}` +
            ` là ${tren.gioiTinh === 'nu' ? 'chị' : 'anh'} của ${duoi.hoTen} dù xét năm sinh có thể ngược lại.`;
        }
      } else {
        moTa = 'Hai người là anh chị em cùng mẹ khác cha.';
      }
    } else {
      const nhanhA = ci.byId.get(tc.a.nut[a - 1]);
      const nhanhB = ci.byId.get(tc.b.nut[b - 1]);
      moTa =
        a === 2
          ? `Hai người là anh chị em ${QU.loaiAnhEmHo(benA, benB)}, chung ông bà là ${tenDayDu(
              ci.byId.get(tc.id)!,
            )}.`
          : `Hai người cùng đời, là anh chị em họ, chung tổ là ${tenDayDu(
              ci.byId.get(tc.id)!,
            )} cách mỗi bên ${a} đời.`;
      if (truocA != null && nhanhA && nhanhB) {
        const nhanhTren = truocA ? nhanhA : nhanhB;
        const nhanhDuoi = truocA ? nhanhB : nhanhA;
        moTa +=
          ` Xưng hô lấy theo thứ bậc nhánh chứ không theo tuổi: ngành ${nhanhTren.hoTen}` +
          ` là ngành trên ngành ${nhanhDuoi.hoTen}.`;
      }
    }
    return { ...chung, AgoiB, BgoiA, chenhDoi: 0, moTa, canhBao };
  }

  // Bàng hệ chênh đời
  const aTren = chenh > 0;
  const tren = aTren ? A : B;
  const duoi = aTren ? B : A;
  const k = Math.abs(chenh);
  const buocTren = aTren ? a : b;
  const benDuoi = aTren ? benB : benA;

  const nhanhTruoc = nhanhAiTruoc(ci, tc, a, b);
  const sinhTruoc = nhanhTruoc === undefined ? undefined : aTren ? nhanhTruoc : !nhanhTruoc;

  const co = QU.vaiCoBan(tren.gioiTinh, benDuoi, sinhTruoc);
  const tienTo = k >= 2 ? QU.tienToBacTren(k, tren.gioiTinh) : '';
  const hauTo = buocTren >= 2 ? ' họ' : '';
  const tuTren = gom(QU.ghepTuChi(co, tienTo, hauTo));
  const tuDuoi: QU.TuXungHo = { chinh: QU.bacDuoiBangHe(k) };

  const moTa =
    `${tenDayDu(tren)} ở vai trên ${tenDayDu(duoi)} ${k} đời trong họ, ` +
    `hai bên chung tổ là ${tenDayDu(ci.byId.get(tc.id)!)}.`;

  return aTren
    ? { ...chung, AgoiB: tuDuoi, BgoiA: tuTren, chenhDoi: k, moTa, canhBao }
    : { ...chung, AgoiB: tuTren, BgoiA: tuDuoi, chenhDoi: -k, moTa, canhBao };
}

/* ---------------- Đường đi để người dùng kiểm chứng ---------------- */

function dungDuongDi(ci: ChiMuc, r: KetQuaHuyet): BuocDuong[] {
  const ten = (id: ID) => ci.byId.get(id)?.hoTen ?? id;
  const dd: BuocDuong[] = [];
  r.nutA.forEach((id, i) => {
    dd.push({
      id,
      hoTen: ten(id),
      quanHe:
        i === 0
          ? ''
          : `là ${r.cacBuocA[i - 1] === 'cha' ? 'cha' : 'mẹ'} của ${ten(r.nutA[i - 1])}`,
    });
  });
  for (let i = r.nutB.length - 2; i >= 0; i--) {
    dd.push({
      id: r.nutB[i],
      hoTen: ten(r.nutB[i]),
      quanHe: `là con của ${ten(r.nutB[i + 1])}`,
    });
  }
  return dd;
}

/* ---------------- Điểm vào chính ---------------- */

function vaiVeChuoi(chenh: number, tenA: string, tenB: string): string {
  if (chenh === 0) return `${tenA} và ${tenB} ngang vai nhau`;
  if (chenh > 0) return `${tenA} ở vai trên ${tenB} ${chenh} đời`;
  return `${tenA} ở vai dưới ${tenB} ${-chenh} đời`;
}

/** So sánh vai vế và cách xưng hô giữa hai người trong họ. */
export function soSanhVaiVe(ci: ChiMuc, idA: ID, idB: ID): KetQuaXungHo {
  const A = ci.byId.get(idA);
  const B = ci.byId.get(idB);
  const doiA = ci.doi.get(idA);
  const doiB = ci.doi.get(idB);

  if (!A || !B) {
    return {
      loai: 'khong-ro',
      AgoiB: '?',
      BgoiA: '?',
      chenhDoi: 0,
      vaiVe: 'Không tìm thấy người',
      duongDi: [],
      giaiThich: 'Không tìm thấy một trong hai người trong dữ liệu gia phả.',
      doiA,
      doiB,
      canhBao: [],
    };
  }

  if (idA === idB) {
    return {
      loai: 'chinh-minh',
      AgoiB: 'chính mình',
      BgoiA: 'chính mình',
      chenhDoi: 0,
      vaiVe: 'Cùng một người',
      duongDi: [{ id: idA, hoTen: A.hoTen, quanHe: '' }],
      giaiThich: `Hai ô đang chọn cùng là ${tenDayDu(A)}.`,
      doiA,
      doiB,
      canhBao: [],
    };
  }

  // Vợ chồng của nhau
  const honNhanChung = (ci.honNhanCua.get(idA) ?? []).find(
    (hn) => hn.chongId === idB || hn.voId === idB,
  );
  if (honNhanChung) {
    return {
      loai: 'hon-nhan',
      AgoiB: B.gioiTinh === 'nu' ? 'vợ' : 'chồng',
      BgoiA: A.gioiTinh === 'nu' ? 'vợ' : 'chồng',
      chenhDoi: 0,
      vaiVe: `${A.hoTen} và ${B.hoTen} là vợ chồng`,
      duongDi: [
        { id: idA, hoTen: A.hoTen, quanHe: '' },
        {
          id: idB,
          hoTen: B.hoTen,
          quanHe: `là ${B.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${A.hoTen}`,
        },
      ],
      giaiThich: `${tenDayDu(A)} và ${tenDayDu(B)} là vợ chồng.`,
      doiA,
      doiB,
      canhBao: [],
    };
  }

  // Huyết thống
  const huyet = quanHeHuyetThong(ci, idA, idB);
  if (huyet) {
    return {
      loai: 'huyet-thong',
      AgoiB: QU.hienThi(huyet.AgoiB),
      BgoiA: QU.hienThi(huyet.BgoiA),
      chenhDoi: huyet.chenhDoi,
      vaiVe: vaiVeChuoi(huyet.chenhDoi, A.hoTen, B.hoTen),
      toChung: ci.byId.get(huyet.toChungId),
      duongDi: dungDuongDi(ci, huyet),
      giaiThich:
        `${huyet.moTa} Vì vậy ${A.hoTen} gọi ${B.hoTen} là ${QU.hienThi(huyet.AgoiB)}, ` +
        `còn ${B.hoTen} gọi ${A.hoTen} là ${QU.hienThi(huyet.BgoiA)}.`,
      doiA,
      doiB,
      canhBao: huyet.canhBao,
    };
  }

  // Qua hôn nhân
  const quaHonNhan = timQuaHonNhan(ci, idA, idB);
  if (quaHonNhan) return quaHonNhan;

  return {
    loai: 'khong-ro',
    AgoiB: 'chưa xác định',
    BgoiA: 'chưa xác định',
    chenhDoi: 0,
    vaiVe: 'Chưa tìm được quan hệ',
    duongDi: [],
    giaiThich:
      'Hai người này chưa nối được với nhau trong dữ liệu hiện có: không tìm thấy tổ chung, ' +
      'cũng không có đường quan hệ qua hôn nhân. Có thể còn thiếu thông tin cha mẹ ở đâu đó.',
    doiA,
    doiB,
    canhBao: [],
  };
}

interface UngVien {
  diem: number;
  AgoiB: QU.TuXungHo;
  BgoiA: QU.TuXungHo;
  chenhDoi: number;
  giaiThich: string;
  duongDi: BuocDuong[];
  canhBao: string[];
}

/** Suy quan hệ dâu, rể, thím, mợ... qua một bước hôn nhân. */
function timQuaHonNhan(ci: ChiMuc, idA: ID, idB: ID): KetQuaXungHo | undefined {
  const A = ci.byId.get(idA)!;
  const B = ci.byId.get(idB)!;
  const ds: UngVien[] = [];
  const soBuoc = (r: KetQuaHuyet) => r.nutA.length + r.nutB.length;

  // A kết hôn vào họ: A là vợ/chồng của S, S có quan hệ máu mủ với B
  for (const hn of ci.honNhanCua.get(idA) ?? []) {
    const sId = hn.chongId === idA ? hn.voId : hn.chongId;
    const S = ci.byId.get(sId);
    if (!S || sId === idB) continue;
    const r = quanHeHuyetThong(ci, sId, idB);
    if (!r) continue;
    const BgoiA = QU.tuDauRe(QU.hienThi(r.BgoiA), A.gioiTinh);
    const AgoiB = r.AgoiB;
    ds.push({
      diem: soBuoc(r) + 1,
      AgoiB,
      BgoiA,
      chenhDoi: r.chenhDoi,
      giaiThich:
        `${tenDayDu(A)} là ${A.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${tenDayDu(S)}. ` +
        `${r.moTa} Vì vậy ${B.hoTen} gọi ${A.hoTen} là ${QU.hienThi(BgoiA)}, ` +
        `còn ${A.hoTen} gọi ${B.hoTen} theo ${A.gioiTinh === 'nu' ? 'chồng' : 'vợ'} là ${QU.hienThi(AgoiB)}.`,
      duongDi: [
        { id: idA, hoTen: A.hoTen, quanHe: '' },
        {
          id: sId,
          hoTen: S.hoTen,
          quanHe: `là ${S.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${A.hoTen}`,
        },
        ...dungDuongDi(ci, r).slice(1),
      ],
      canhBao: [...r.canhBao, ...(BgoiA.canhBao ? [BgoiA.canhBao] : [])],
    });
  }

  // B kết hôn vào họ
  for (const hn of ci.honNhanCua.get(idB) ?? []) {
    const sId = hn.chongId === idB ? hn.voId : hn.chongId;
    const S = ci.byId.get(sId);
    if (!S || sId === idA) continue;
    const r = quanHeHuyetThong(ci, idA, sId);
    if (!r) continue;
    const AgoiB = QU.tuDauRe(QU.hienThi(r.AgoiB), B.gioiTinh);
    const BgoiA = r.BgoiA;
    ds.push({
      diem: soBuoc(r) + 1,
      AgoiB,
      BgoiA,
      chenhDoi: r.chenhDoi,
      giaiThich:
        `${tenDayDu(B)} là ${B.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${tenDayDu(S)}. ` +
        `${r.moTa} Vì vậy ${A.hoTen} gọi ${B.hoTen} là ${QU.hienThi(AgoiB)}, ` +
        `còn ${B.hoTen} gọi ${A.hoTen} theo ${B.gioiTinh === 'nu' ? 'chồng' : 'vợ'} là ${QU.hienThi(BgoiA)}.`,
      duongDi: [
        ...dungDuongDi(ci, r),
        {
          id: idB,
          hoTen: B.hoTen,
          quanHe: `là ${B.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${S.hoTen}`,
        },
      ],
      canhBao: [...r.canhBao, ...(AgoiB.canhBao ? [AgoiB.canhBao] : [])],
    });
  }

  if (ds.length === 0) return timThongGia(ci, idA, idB);
  ds.sort((x, y) => x.diem - y.diem);
  const tot = ds[0];
  return {
    loai: 'hon-nhan',
    AgoiB: QU.hienThi(tot.AgoiB),
    BgoiA: QU.hienThi(tot.BgoiA),
    chenhDoi: tot.chenhDoi,
    vaiVe: vaiVeChuoi(tot.chenhDoi, A.hoTen, B.hoTen),
    duongDi: tot.duongDi,
    giaiThich: tot.giaiThich,
    doiA: ci.doi.get(idA),
    doiB: ci.doi.get(idB),
    canhBao: tot.canhBao,
  };
}

/** Hai bên đều phải qua hôn nhân mới nối được: quan hệ thông gia. */
function timThongGia(ci: ChiMuc, idA: ID, idB: ID): KetQuaXungHo | undefined {
  const A = ci.byId.get(idA)!;
  const B = ci.byId.get(idB)!;
  for (const hnA of ci.honNhanCua.get(idA) ?? []) {
    const sA = hnA.chongId === idA ? hnA.voId : hnA.chongId;
    for (const hnB of ci.honNhanCua.get(idB) ?? []) {
      const sB = hnB.chongId === idB ? hnB.voId : hnB.chongId;
      if (sA === sB) continue;
      const r = quanHeHuyetThong(ci, sA, sB);
      if (!r) continue;
      const nA = ci.byId.get(sA)!;
      const nB = ci.byId.get(sB)!;
      return {
        loai: 'hon-nhan',
        AgoiB: 'người bên thông gia',
        BgoiA: 'người bên thông gia',
        chenhDoi: r.chenhDoi,
        vaiVe: vaiVeChuoi(r.chenhDoi, A.hoTen, B.hoTen),
        duongDi: [
          { id: idA, hoTen: A.hoTen, quanHe: '' },
          {
            id: sA,
            hoTen: nA.hoTen,
            quanHe: `là ${nA.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${A.hoTen}`,
          },
          ...dungDuongDi(ci, r).slice(1),
          {
            id: idB,
            hoTen: B.hoTen,
            quanHe: `là ${B.gioiTinh === 'nu' ? 'vợ' : 'chồng'} của ${nB.hoTen}`,
          },
        ],
        giaiThich:
          `Hai người không cùng huyết thống. ${tenDayDu(A)} là vợ/chồng của ${tenDayDu(nA)}, ` +
          `${tenDayDu(B)} là vợ/chồng của ${tenDayDu(nB)}. ${r.moTa} ` +
          'Đây là quan hệ thông gia.',
        doiA: ci.doi.get(idA),
        doiB: ci.doi.get(idB),
        canhBao: ['Quan hệ thông gia không có cách gọi cố định, thường xưng hô theo vai của vợ/chồng mình.'],
      };
    }
  }
  return undefined;
}
