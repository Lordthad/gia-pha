import type { ID } from '../types/giapha';
import { chaMeIds, layNam, namMat, namSinh, type ChiMuc } from './chiMuc';
import { chuanHoa } from './tiengViet';

export type MucDo = 'loi' | 'canh-bao' | 'goi-y';

export interface VanDe {
  mucDo: MucDo;
  nhom: string;
  thongDiep: string;
  nguoiIds: ID[];
}

/**
 * Rà soát dữ liệu gia phả: lỗi làm sai lệch tính toán vai vế được xếp mức "lỗi",
 * chỗ thiếu thông tin khiến không chốt được bác/chú xếp mức "cảnh báo".
 */
export function kiemTraToanVen(ci: ChiMuc): VanDe[] {
  const vd: VanDe[] = [];
  const ds = ci.giaPha.nguoi;

  // Trùng mã người
  const dem = new Map<ID, number>();
  for (const p of ds) dem.set(p.id, (dem.get(p.id) ?? 0) + 1);
  for (const [id, n] of dem) {
    if (n > 1) {
      vd.push({ mucDo: 'loi', nhom: 'Trùng mã', thongDiep: `Mã ${id} bị dùng cho ${n} người.`, nguoiIds: [id] });
    }
  }

  for (const p of ds) {
    // Cha mẹ không tồn tại
    for (const cm of [p.chaId, p.meId]) {
      if (cm && !ci.byId.has(cm)) {
        vd.push({
          mucDo: 'loi',
          nhom: 'Thiếu liên kết',
          thongDiep: `${p.hoTen} trỏ tới cha/mẹ mã ${cm} nhưng không có người này trong gia phả.`,
          nguoiIds: [p.id],
        });
      }
    }

    // Giới tính của cha mẹ
    const cha = p.chaId ? ci.byId.get(p.chaId) : undefined;
    const me = p.meId ? ci.byId.get(p.meId) : undefined;
    if (cha && cha.gioiTinh === 'nu') {
      vd.push({
        mucDo: 'canh-bao',
        nhom: 'Giới tính',
        thongDiep: `${cha.hoTen} được ghi là cha của ${p.hoTen} nhưng giới tính là nữ.`,
        nguoiIds: [cha.id, p.id],
      });
    }
    if (me && me.gioiTinh === 'nam') {
      vd.push({
        mucDo: 'canh-bao',
        nhom: 'Giới tính',
        thongDiep: `${me.hoTen} được ghi là mẹ của ${p.hoTen} nhưng giới tính là nam.`,
        nguoiIds: [me.id, p.id],
      });
    }

    // Ngày ghi có ra hình một cái ngày không
    for (const [ten, nt] of [
      ['ngày sinh', p.sinh],
      ['ngày mất', p.mat],
    ] as const) {
      // Dạng "????-05-12" là cố ý ghi thiếu năm, không phải lỗi.
      if (nt?.duong && !nt.duong.startsWith('????') && layNam(nt) == null) {
        vd.push({
          mucDo: 'loi',
          nhom: 'Ngày tháng',
          thongDiep: `${p.hoTen} có ${ten} ghi là "${nt.duong}" — không đọc ra năm được nên phần mềm đang bỏ qua. Sửa lại thành năm đủ 4 chữ số.`,
          nguoiIds: [p.id],
        });
      }
    }

    // Năm sinh / năm mất
    const ns = namSinh(p);
    const nm = namMat(p);
    if (ns && nm && nm < ns) {
      vd.push({
        mucDo: 'loi',
        nhom: 'Ngày tháng',
        thongDiep: `${p.hoTen} có năm mất (${nm}) trước năm sinh (${ns}).`,
        nguoiIds: [p.id],
      });
    }
    for (const cm of [cha, me]) {
      if (!cm) continue;
      const nc = namSinh(cm);
      if (ns && nc && nc >= ns) {
        vd.push({
          mucDo: 'loi',
          nhom: 'Ngày tháng',
          thongDiep: `${cm.hoTen} (sinh ${nc}) không thể là cha/mẹ của ${p.hoTen} (sinh ${ns}).`,
          nguoiIds: [cm.id, p.id],
        });
      } else if (ns && nc && ns - nc < 15) {
        vd.push({
          mucDo: 'canh-bao',
          nhom: 'Ngày tháng',
          thongDiep: `${cm.hoTen} sinh ${nc}, chỉ hơn ${p.hoTen} ${ns - nc} tuổi — cần xem lại.`,
          nguoiIds: [cm.id, p.id],
        });
      }
    }
  }

  // Vòng lặp cha con
  for (const p of ds) {
    const daQua = new Set<ID>([p.id]);
    let hangDoi = chaMeIds(p);
    let vong = false;
    while (hangDoi.length && !vong) {
      const tiep: ID[] = [];
      for (const id of hangDoi) {
        if (id === p.id) {
          vong = true;
          break;
        }
        if (daQua.has(id)) continue;
        daQua.add(id);
        tiep.push(...chaMeIds(ci.byId.get(id)));
      }
      hangDoi = tiep;
    }
    if (vong) {
      vd.push({
        mucDo: 'loi',
        nhom: 'Vòng lặp',
        thongDiep: `${p.hoTen} là tổ tiên của chính mình — dữ liệu cha/mẹ bị lặp vòng.`,
        nguoiIds: [p.id],
      });
    }
  }

  // Anh em thiếu thứ tự sinh -> không chốt được bác hay chú
  for (const [chaId, conIds] of ci.conCua) {
    if (conIds.length < 2) continue;
    const thieu = conIds.filter((id) => {
      const c = ci.byId.get(id)!;
      return c.thuTu == null && namSinh(c) == null;
    });
    if (thieu.length) {
      const cha = ci.byId.get(chaId)!;
      vd.push({
        mucDo: 'canh-bao',
        nhom: 'Thứ tự sinh',
        thongDiep:
          `Các con của ${cha.hoTen} thiếu thứ tự sinh và năm sinh: ` +
          thieu.map((id) => ci.byId.get(id)!.hoTen).join(', ') +
          '. Chưa xác định được ai là bác, ai là chú.',
        nguoiIds: thieu,
      });
    }
  }

  // Người chưa nối vào cây
  const thuyTo = ci.giaPha.dongHo.thuyToId;
  if (thuyTo && ci.byId.has(thuyTo)) {
    const noi = new Set<ID>();
    const hangDoi: ID[] = [thuyTo];
    while (hangDoi.length) {
      const id = hangDoi.shift()!;
      if (noi.has(id)) continue;
      noi.add(id);
      for (const c of ci.conCua.get(id) ?? []) hangDoi.push(c);
      for (const cm of chaMeIds(ci.byId.get(id))) hangDoi.push(cm);
      for (const hn of ci.honNhanCua.get(id) ?? []) {
        hangDoi.push(hn.chongId === id ? hn.voId : hn.chongId);
      }
    }
    const roi = ds.filter((p) => !noi.has(p.id));
    if (roi.length) {
      vd.push({
        mucDo: 'canh-bao',
        nhom: 'Chưa nối vào cây',
        thongDiep:
          `${roi.length} người chưa nối được với thuỷ tổ: ` +
          roi
            .slice(0, 8)
            .map((p) => p.hoTen)
            .join(', ') +
          (roi.length > 8 ? '...' : '') +
          '. Hãy bổ sung cha, mẹ hoặc vợ/chồng cho họ.',
        nguoiIds: roi.map((p) => p.id),
      });
    }
  } else {
    vd.push({
      mucDo: 'canh-bao',
      nhom: 'Thuỷ tổ',
      thongDiep: 'Chưa chọn thuỷ tổ cho dòng họ nên số đời có thể tính chưa đúng.',
      nguoiIds: [],
    });
  }

  // Trùng tên nghi trùng bản ghi
  const theoTen = new Map<string, ID[]>();
  for (const p of ds) {
    const khoa = `${chuanHoa(p.hoTen)}|${namSinh(p) ?? ''}`;
    const cu = theoTen.get(khoa);
    if (cu) cu.push(p.id);
    else theoTen.set(khoa, [p.id]);
  }
  for (const [, ids] of theoTen) {
    if (ids.length > 1) {
      vd.push({
        mucDo: 'goi-y',
        nhom: 'Nghi trùng',
        thongDiep: `${ci.byId.get(ids[0])!.hoTen} xuất hiện ${ids.length} lần với cùng năm sinh — có thể là một người bị nhập hai lần.`,
        nguoiIds: ids,
      });
    }
  }

  // Hôn nhân trỏ tới người không tồn tại
  for (const hn of ci.giaPha.honNhan) {
    for (const id of [hn.chongId, hn.voId]) {
      if (!ci.byId.has(id)) {
        vd.push({
          mucDo: 'loi',
          nhom: 'Thiếu liên kết',
          thongDiep: `Hôn nhân ${hn.id} trỏ tới người mã ${id} không có trong gia phả.`,
          nguoiIds: [],
        });
      }
    }
  }

  const uuTien: Record<MucDo, number> = { loi: 0, 'canh-bao': 1, 'goi-y': 2 };
  return vd.sort((a, b) => uuTien[a.mucDo] - uuTien[b.mucDo]);
}
