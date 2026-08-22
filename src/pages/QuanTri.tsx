import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useChiMuc, useGiaPha } from '../boiCanh/GiaPhaContext';
import FormNguoi from '../components/FormNguoi';
import Icon from '../components/Icon';
import { DongNguoi } from '../components/TheNguoi';
import { bamMa, coTheMaHoa, doManhMatKhau } from '../lib/baoMat';
import {
  catToken,
  daKhaiKho,
  dayLenGitHub,
  docKho,
  doiKhoaToken,
  KHO_TRONG,
  kiemTraKetNoi,
  layToken,
  luuKho,
  sanSangDay,
  xoaKho,
  xoaToken,
  type KhoGitHub,
  type LuuGitHub,
} from '../lib/github';
import { kiemTraToanVen, type MucDo } from '../lib/kiemTra';
import {
  docFileGiaPha,
  duongDanDuLieu,
  ghiVaoThuMuc,
  hoTroGhiThuMuc,
  maMoi,
  noiDungXuat,
  xuatJson,
  xuatZip,
} from '../lib/luuTru';
import { timNguoi } from '../lib/timKiem';
import type { GiaPha, ID, Person } from '../types/giapha';

type Tab = 'nguoi' | 'dong-ho' | 'bao-mat' | 'kiem-tra' | 'xuat-nhap';

const MAU_MUC_DO: Record<MucDo, string> = {
  loi: 'bg-red-50 ring-red-300 text-red-900 toi:bg-red-950/50 toi:ring-red-900 toi:text-red-200',
  'canh-bao':
    'bg-amber-50 ring-amber-300 text-amber-900 toi:bg-amber-950/50 toi:ring-amber-900 toi:text-amber-200',
  'goi-y':
    'bg-stone-50 ring-stone-300 text-stone-700 toi:bg-stone-800 toi:ring-stone-700 toi:text-stone-300',
};

const TEN_MUC_DO: Record<MucDo, string> = {
  loi: 'Lỗi',
  'canh-bao': 'Cần xem lại',
  'goi-y': 'Gợi ý',
};

/** Tách một dòng CSV, hỗ trợ dấu nháy kép. */
function tachDongCsv(dong: string): string[] {
  const o: string[] = [];
  let hienTai = '';
  let trongNhay = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (c === '"') {
      if (trongNhay && dong[i + 1] === '"') {
        hienTai += '"';
        i++;
      } else trongNhay = !trongNhay;
    } else if (c === ',' && !trongNhay) {
      o.push(hienTai);
      hienTai = '';
    } else hienTai += c;
  }
  o.push(hienTai);
  return o.map((x) => x.trim());
}

export default function QuanTri() {
  const ci = useChiMuc();
  const { giaPha, capNhat, boBanNhap, tuBanNhap, matKhauXem, datMatKhauXem, quanTriMoKhoa, maQuanTriDangDung, moKhoaQuanTri, datQuanTriMoKhoa } =
    useGiaPha();
  const [thamSo] = useSearchParams();
  const [tab, datTab] = useState<Tab>('nguoi');
  // Cho phép mở thẳng form của một người qua đường dẫn /quan-tri?sua=P012
  const [suaId, datSuaId] = useState<ID | undefined>(() => thamSo.get('sua') ?? undefined);
  const [tuKhoa, datTuKhoa] = useState('');
  const [thongBao, datThongBao] = useState<string>();
  const [maNhap, datMaNhap] = useState('');
  const [loiMa, datLoiMa] = useState<string>();
  const [mkMoi, datMkMoi] = useState('');
  const [mkLai, datMkLai] = useState('');
  const [maMoiNhap, datMaMoiNhap] = useState('');
  const [kho, datKho] = useState<LuuGitHub>(() => docKho());
  const [token, datToken] = useState('');
  const [ghBan, datGhBan] = useState(false);
  const [ghLoi, datGhLoi] = useState<string>();
  const oTep = useRef<HTMLInputElement>(null);

  const gp = giaPha!;
  const ketQua = useMemo(() => timNguoi(ci, { tuKhoa: tuKhoa || undefined }), [ci, tuKhoa]);
  const vanDe = useMemo(() => kiemTraToanVen(ci), [ci]);
  const soLoi = vanDe.filter((v) => v.mucDo === 'loi').length;

  const nguoiSua = suaId ? ci.byId.get(suaId) : undefined;

  const luuNguoi = (p: Person) => {
    const co = gp.nguoi.some((x) => x.id === p.id);
    capNhat({
      ...gp,
      nguoi: co ? gp.nguoi.map((x) => (x.id === p.id ? p : x)) : [...gp.nguoi, p],
    });
    datThongBao(`Đã lưu ${p.hoTen}.`);
    datSuaId(undefined);
  };

  const themNguoi = () => {
    const id = maMoi(gp.nguoi.map((x) => x.id));
    capNhat({ ...gp, nguoi: [...gp.nguoi, { id, hoTen: '', gioiTinh: 'nam' }] });
    datSuaId(id);
  };

  const xoaNguoi = (id: ID) => {
    const p = ci.byId.get(id);
    if (!p) return;
    const conCai = ci.conCua.get(id) ?? [];
    const canhBao =
      conCai.length > 0
        ? `\n\n${p.hoTen} đang là cha/mẹ của ${conCai.length} người. Xoá xong những người đó sẽ mất liên kết cha/mẹ.`
        : '';
    if (!confirm(`Xoá ${p.hoTen || 'người này'} khỏi gia phả?${canhBao}`)) return;
    capNhat({
      ...gp,
      nguoi: gp.nguoi
        .filter((x) => x.id !== id)
        .map((x) => ({
          ...x,
          chaId: x.chaId === id ? null : x.chaId,
          meId: x.meId === id ? null : x.meId,
        })),
      honNhan: gp.honNhan.filter((h) => h.chongId !== id && h.voId !== id),
      dongHo: gp.dongHo.thuyToId === id ? { ...gp.dongHo, thuyToId: undefined } : gp.dongHo,
    });
    datSuaId(undefined);
    datThongBao(`Đã xoá ${p.hoTen}.`);
  };

  const themHonNhan = (idA: ID, idB: ID) => {
    const a = ci.byId.get(idA)!;
    const b = ci.byId.get(idB)!;
    const chongId = a.gioiTinh === 'nu' ? idB : idA;
    const voId = chongId === idA ? idB : idA;
    const id = `H${String(gp.honNhan.length + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
    capNhat({
      ...gp,
      honNhan: [
        ...gp.honNhan,
        { id, chongId, voId, thuTu: (ci.honNhanCua.get(chongId)?.length ?? 0) + 1 },
      ],
    });
    datThongBao(`Đã nối ${a.hoTen} với ${b.hoTen}.`);
  };

  // Mở khoá mã truy cập ngay khi vào được mục Quản trị.
  useEffect(() => {
    if (!maQuanTriDangDung || !kho.tokenMaHoa || token) return;
    let huy = false;
    layToken(kho, maQuanTriDangDung).then((t) => {
      if (!huy && t) datToken(t);
    });
    return () => {
      huy = true;
    };
  }, [maQuanTriDangDung, kho, token]);

  const datKhoTruong = (khoa: keyof KhoGitHub, gt: string) => {
    const moi = { ...kho, [khoa]: gt };
    datKho(moi);
    luuKho(moi);
  };

  const cauHinhDay = { ...kho, token };

  const luuToken = async () => {
    if (!maQuanTriDangDung) {
      datGhLoi('Hãy đặt mã quản trị ở thẻ Bảo mật trước, mã truy cập sẽ được khoá bằng mã đó.');
      return;
    }
    datGhBan(true);
    datGhLoi(undefined);
    try {
      datKho(await catToken(kho, token, maQuanTriDangDung));
      datThongBao('Đã cất mã truy cập, khoá bằng mã quản trị.');
    } catch (e) {
      datGhLoi(e instanceof Error ? e.message : String(e));
    } finally {
      datGhBan(false);
    }
  };

  const thuKetNoi = async () => {
    datGhBan(true);
    datGhLoi(undefined);
    try {
      datThongBao(await kiemTraKetNoi(cauHinhDay));
    } catch (e) {
      datGhLoi(e instanceof Error ? e.message : String(e));
    } finally {
      datGhBan(false);
    }
  };

  const dayLen = async () => {
    if (!confirm('Đưa toàn bộ gia phả hiện tại lên mạng cho cả họ xem?')) return;
    datGhBan(true);
    datGhLoi(undefined);
    try {
      const noiDung = await noiDungXuat(gp, matKhauXem);
      datThongBao(await dayLenGitHub(cauHinhDay, gp, noiDung, datThongBao));
    } catch (e) {
      datGhLoi(e instanceof Error ? e.message : String(e));
    } finally {
      datGhBan(false);
    }
  };

  const nhapCsv = async (tep: File) => {
    const chu = await tep.text();
    const dong = chu.split(/\r?\n/).filter((d) => d.trim());
    if (dong.length < 2) {
      datThongBao('File không có dữ liệu.');
      return;
    }
    const cot = tachDongCsv(dong[0]).map((c) => c.replace(/^﻿/, ''));
    const moi: Person[] = [];
    for (const d of dong.slice(1)) {
      const o = tachDongCsv(d);
      const r: Record<string, string> = {};
      cot.forEach((c, i) => (r[c] = o[i] ?? ''));
      if (!r.hoTen) continue;
      const p: Person = {
        id: r.id || maMoi([...gp.nguoi.map((x) => x.id), ...moi.map((x) => x.id)]),
        hoTen: r.hoTen,
        gioiTinh: r.gioiTinh === 'nu' ? 'nu' : r.gioiTinh === 'khac' ? 'khac' : 'nam',
      };
      if (r.chaId) p.chaId = r.chaId;
      if (r.meId) p.meId = r.meId;
      if (r.thuTu) p.thuTu = Number(r.thuTu);
      if (r.chiNhanh) p.chiNhanh = r.chiNhanh;
      if (r.sinh) p.sinh = { duong: r.sinh };
      if (r.mat) p.mat = { duong: r.mat };
      if (r.gioNgay && r.gioThang) p.gioAm = { ngay: Number(r.gioNgay), thang: Number(r.gioThang) };
      if (r.queQuan) p.queQuan = r.queQuan;
      if (r.ngheNghiep) p.ngheNghiep = r.ngheNghiep;
      if (r.congDuc) p.congDuc = r.congDuc;
      if (r.ghiChu) p.ghiChu = r.ghiChu;
      moi.push(p);
    }
    const cu = new Map(gp.nguoi.map((x) => [x.id, x]));
    for (const p of moi) cu.set(p.id, { ...cu.get(p.id), ...p });
    capNhat({ ...gp, nguoi: [...cu.values()] });
    datThongBao(`Đã nhập ${moi.length} người từ file CSV.`);
  };

  const napDuLieuMau = async () => {
    if (
      gp.nguoi.length > 0 &&
      !confirm(`Thay toàn bộ ${gp.nguoi.length} người hiện có bằng dữ liệu mẫu?`)
    ) {
      return;
    }
    try {
      const res = await fetch(duongDanDuLieu('giapha-mau.json'));
      if (!res.ok) throw new Error(`không đọc được file mẫu (${res.status})`);
      const mau = (await res.json()) as GiaPha;
      capNhat(mau);
      datThongBao(`Đã nạp dữ liệu mẫu: ${mau.nguoi.length} người. Đây chỉ là ví dụ để xem thử.`);
    } catch (e) {
      datThongBao(`Không nạp được dữ liệu mẫu: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const xoaTatCa = () => {
    if (!confirm(`Xoá sạch ${gp.nguoi.length} người để nhập lại từ đầu?`)) return;
    capNhat({ ...gp, nguoi: [], honNhan: [], dongHo: { ...gp.dongHo, thuyToId: undefined } });
    datThongBao('Đã xoá sạch dữ liệu. Vào Cây họ để bắt đầu từ cụ thuỷ tổ.');
  };

  const nhapFile = async (tep: File) => {
    try {
      if (tep.name.toLowerCase().endsWith('.csv')) {
        await nhapCsv(tep);
        return;
      }
      const moi = await docFileGiaPha(tep, matKhauXem);
      if (!moi.nguoi) throw new Error('File không đúng định dạng gia phả');
      if (!confirm(`Thay toàn bộ dữ liệu hiện tại bằng ${moi.nguoi.length} người trong file này?`))
        return;
      capNhat(moi as GiaPha);
      datThongBao(`Đã nạp ${moi.nguoi.length} người từ ${tep.name}.`);
    } catch (e) {
      datThongBao(`Không đọc được file: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const lopTab = (dang: boolean) =>
    `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
      dang
        ? 'bg-white text-amber-900 shadow-sm toi:bg-stone-700 toi:text-amber-300'
        : 'text-stone-600 toi:text-stone-400'
    }`;

  // Cửa vào mục Quản trị: chỉ là khoá cho gọn, không phải lớp bảo mật thật.
  if (gp.dongHo.maQuanTri && !quanTriMoKhoa) {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-10">
        <h1 className="text-center text-xl font-semibold">Mục Quản trị</h1>
        <form
          className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800"
          onSubmit={async (e) => {
            e.preventDefault();
            const dung = await moKhoaQuanTri(maNhap);
            datLoiMa(dung ? undefined : 'Mã không đúng.');
            if (dung) datMaNhap('');
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Mã quản trị
            </span>
            <input
              type="password"
              value={maNhap}
              onChange={(e) => datMaNhap(e.target.value)}
              autoComplete="off"
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            />
          </label>
          {loiMa && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 toi:bg-red-950 toi:text-red-300">
              {loiMa}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white"
          >
            Mở mục Quản trị
          </button>
        </form>
        <p className="text-center text-sm text-stone-500">
          Mã này do người giữ gia phả đặt. Quên mã thì sửa lại trong file dữ liệu gốc.
        </p>
      </div>
    );
  }

  if (nguoiSua) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => datSuaId(undefined)}
          className="-ml-2 flex items-center gap-1 text-sm font-medium text-stone-600 toi:text-stone-400"
        >
          <Icon ten="quay-lai" className="size-4" />
          Về danh sách
        </button>
        <h1 className="text-xl font-semibold">
          {nguoiSua.hoTen ? `Sửa: ${nguoiSua.hoTen}` : 'Thêm người mới'}
        </h1>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <FormNguoi
            key={nguoiSua.id}
            nguoi={nguoiSua}
            onLuu={luuNguoi}
            onDong={() => datSuaId(undefined)}
            onXoa={() => xoaNguoi(nguoiSua.id)}
            onThemHonNhan={(kia) => themHonNhan(nguoiSua.id, kia)}
            onXoaHonNhan={(hnId) =>
              capNhat({ ...gp, honNhan: gp.honNhan.filter((h) => h.id !== hnId) })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Quản trị gia phả</h1>

      {thongBao && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900 ring-1 ring-emerald-300 toi:bg-emerald-950/50 toi:text-emerald-200 toi:ring-emerald-900">
          <span className="flex-1">{thongBao}</span>
          <button type="button" onClick={() => datThongBao(undefined)} className="!min-h-0">
            <Icon ten="dong" className="size-5" />
          </button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 toi:bg-stone-800">
        <button type="button" onClick={() => datTab('nguoi')} className={lopTab(tab === 'nguoi')}>
          Người ({gp.nguoi.length})
        </button>
        <button type="button" onClick={() => datTab('dong-ho')} className={lopTab(tab === 'dong-ho')}>
          Dòng họ
        </button>
        <button type="button" onClick={() => datTab('bao-mat')} className={lopTab(tab === 'bao-mat')}>
          Bảo mật
        </button>
        <button
          type="button"
          onClick={() => datTab('kiem-tra')}
          className={lopTab(tab === 'kiem-tra')}
        >
          Kiểm tra {soLoi > 0 && <span className="text-red-600">({soLoi})</span>}
        </button>
        <button
          type="button"
          onClick={() => datTab('xuat-nhap')}
          className={lopTab(tab === 'xuat-nhap')}
        >
          Xuất / Nhập
        </button>
      </div>

      {tab === 'nguoi' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => datTuKhoa(e.target.value)}
              placeholder="Tìm người cần sửa..."
              className="flex-1 rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700"
            />
            <button
              type="button"
              onClick={themNguoi}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 font-medium text-white"
            >
              <Icon ten="them" className="size-5" />
              Thêm
            </button>
          </div>
          <ul className="space-y-2">
            {ketQua.map((p) => (
              <li key={p.id}>
                <DongNguoi
                  nguoi={p}
                  onClick={() => datSuaId(p.id)}
                  phu={`${p.id} · Đời ${ci.doi.get(p.id)}${p.hoTen ? '' : ' · chưa đặt tên'}`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'dong-ho' && (
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Tên dòng họ
            </span>
            <input
              value={gp.dongHo.ten}
              onChange={(e) => capNhat({ ...gp, dongHo: { ...gp.dongHo, ten: e.target.value } })}
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Thuỷ tổ (mốc tính đời 1)
            </span>
            <select
              value={gp.dongHo.thuyToId ?? ''}
              onChange={(e) =>
                capNhat({
                  ...gp,
                  dongHo: { ...gp.dongHo, thuyToId: e.target.value || undefined },
                })
              }
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            >
              <option value="">— Chưa chọn —</option>
              {gp.nguoi.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.hoTen} ({p.id})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Lời tựa
            </span>
            <textarea
              rows={6}
              value={gp.dongHo.loiTua ?? ''}
              onChange={(e) =>
                capNhat({ ...gp, dongHo: { ...gp.dongHo, loiTua: e.target.value || undefined } })
              }
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            />
          </label>

          <p className="text-sm text-stone-500">
            Quy ước xưng hô đang dùng: <strong>miền Bắc</strong>. Anh/chị của cha mẹ đều gọi là bác;
            em trai cha là chú, em gái cha là cô, em trai mẹ là cậu, em gái mẹ là dì.
          </p>
        </div>
      )}

      {tab === 'bao-mat' && (
        <div className="space-y-4">
          {!coTheMaHoa() && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-red-900 ring-1 ring-red-300 toi:bg-red-950/50 toi:text-red-200 toi:ring-red-900">
              Trình duyệt đang mở trang theo cách không cho phép mã hoá. Hãy mở qua địa chỉ
              <code> https://</code> hoặc <code> localhost</code>, đừng mở thẳng file trong máy.
            </p>
          )}

          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Mã xem — cho cả họ</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              Một mã dùng chung cho tất cả người trong họ. Ai có mã là xem được, không cần email,
              không cần lập tài khoản. Đặt mã thì file <code>giapha.json</code> đưa lên mạng sẽ được
              mã hoá, người không có mã dù tải thẳng file về cũng không đọc nổi. Đổi mã lúc nào cũng
              được — đổi xong nhớ đưa dữ liệu lên lại.
            </p>

            <div
              className={`rounded-xl px-3 py-2 text-sm ring-1 ${
                matKhauXem
                  ? 'bg-emerald-50 text-emerald-900 ring-emerald-300 toi:bg-emerald-950/50 toi:text-emerald-200 toi:ring-emerald-900'
                  : 'bg-amber-50 text-amber-900 ring-amber-300 toi:bg-amber-950/50 toi:text-amber-200 toi:ring-amber-900'
              }`}
            >
              {matKhauXem
                ? 'Đang bật: bản xuất tiếp theo sẽ được mã hoá.'
                : 'Chưa đặt: ai vào website cũng đọc được toàn bộ gia phả.'}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Mã mới
                </span>
                <input
                  type="password"
                  value={mkMoi}
                  onChange={(e) => datMkMoi(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Nhập lại
                </span>
                <input
                  type="password"
                  value={mkLai}
                  onChange={(e) => datMkLai(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
            </div>

            {mkMoi && (
              <p className="text-sm text-stone-600 toi:text-stone-400">
                Độ mạnh: <strong>{doManhMatKhau(mkMoi).nhan}</strong>
                {doManhMatKhau(mkMoi).loiKhuyen ? ` — ${doManhMatKhau(mkMoi).loiKhuyen}` : ''}
              </p>
            )}

            {mkMoi && mkLai && mkMoi !== mkLai && (
              <p className="text-sm text-red-700 toi:text-red-400">Hai ô chưa khớp nhau.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!mkMoi || mkMoi !== mkLai || doManhMatKhau(mkMoi).diem === 0}
                onClick={() => {
                  datMatKhauXem(mkMoi);
                  datMkMoi('');
                  datMkLai('');
                  datTab('xuat-nhap');
                  datThongBao(
                    'Đã đặt mã xem. Bấm "Đưa lên mạng ngay" thì mã mới có hiệu lực với cả họ.',
                  );
                }}
                className="rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white disabled:opacity-40"
              >
                Đặt mã xem
              </button>
              <button
                type="button"
                disabled={!matKhauXem}
                onClick={() => {
                  if (!confirm('Bỏ mã xem? Bản đưa lên mạng sau sẽ để ngỏ cho mọi người đọc.')) return;
                  datMatKhauXem(undefined);
                  datThongBao('Đã bỏ mã xem. Nhớ đưa dữ liệu lên mạng lại.');
                }}
                className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 disabled:opacity-40 toi:bg-red-950 toi:text-red-300"
              >
                Bỏ mã xem
              </button>
            </div>

            <p className="text-sm text-stone-500">
              Mã không lưu ở đâu để lấy lại được. Quên là mất luôn bản đã mã hoá — hãy giữ một bản
              <code> giapha.json</code> chưa mã hoá ở nơi kín đáo để phòng thân.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Mã quản trị — chỉ cho người lo việc gia phả</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              Mã này khác hẳn mã xem: nó là chìa khoá giữ mã truy cập GitHub. Không có nó thì không
              mở được mã truy cập, mà không có mã truy cập thì không đổi được thứ cả họ nhìn thấy.
              Chỉ nên đưa cho một hai người.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block flex-1">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Mã mới
                </span>
                <input
                  type="password"
                  value={maMoiNhap}
                  onChange={(e) => datMaMoiNhap(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <button
                type="button"
                disabled={maMoiNhap.length < 4}
                onClick={async () => {
                  const b = await bamMa(maMoiNhap);
                  capNhat({ ...gp, dongHo: { ...gp.dongHo, maQuanTri: b } });
                  // Mã truy cập GitHub đang khoá bằng mã cũ, phải khoá lại bằng mã mới.
                  if (kho.tokenMaHoa && maQuanTriDangDung) {
                    const moi = await doiKhoaToken(kho, maQuanTriDangDung, maMoiNhap);
                    if (moi) datKho(moi);
                  } else if (token) {
                    datKho(await catToken(kho, token, maMoiNhap));
                  }
                  // Người vừa đặt mã thì không phải nhập lại ngay trong phiên này.
                  datQuanTriMoKhoa(true, maMoiNhap);
                  datMaMoiNhap('');
                  datThongBao('Đã đặt mã quản trị. Nhớ đưa dữ liệu lên mạng lại.');
                }}
                className="rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white disabled:opacity-40"
              >
                Đặt mã
              </button>
              {gp.dongHo.maQuanTri && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      datQuanTriMoKhoa(false);
                      datToken('');
                    }}
                    className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
                  >
                    Khoá lại ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        kho.tokenMaHoa &&
                        !confirm(
                          'Bỏ mã quản trị thì mã truy cập GitHub đang cất trong máy cũng bị xoá theo, vì không còn chìa khoá nào giữ nó. Tiếp tục?',
                        )
                      ) {
                        return;
                      }
                      if (kho.tokenMaHoa) {
                        datKho(xoaToken(kho));
                        datToken('');
                      }
                      capNhat({ ...gp, dongHo: { ...gp.dongHo, maQuanTri: undefined } });
                      datThongBao('Đã bỏ mã quản trị.');
                    }}
                    className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 toi:bg-red-950 toi:text-red-300"
                  >
                    Bỏ mã
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-stone-500">
              Người xem được gia phả vẫn có thể sửa bản sao trong máy họ — điều đó vô hại, vì bản
              sao ấy không tới được ai khác. Thứ quyết định ai đổi được dữ liệu chung là{' '}
              <strong>mã truy cập GitHub</strong>, mà mã đó lại nằm trong két do mã quản trị này
              khoá.
            </p>
          </section>
        </div>
      )}

      {tab === 'kiem-tra' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600 toi:text-stone-400">
            {vanDe.length === 0
              ? 'Không phát hiện vấn đề nào trong dữ liệu.'
              : `Phát hiện ${vanDe.length} điểm cần xem lại.`}
          </p>
          {vanDe.map((v, i) => (
            <div key={i} className={`rounded-xl px-4 py-3 ring-1 ${MAU_MUC_DO[v.mucDo]}`}>
              <div className="mb-0.5 text-xs font-semibold uppercase">
                {TEN_MUC_DO[v.mucDo]} · {v.nhom}
              </div>
              <p>{v.thongDiep}</p>
              {v.nguoiIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {v.nguoiIds.slice(0, 6).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => datSuaId(id)}
                      className="!min-h-0 rounded-lg bg-white/70 px-2 py-1 text-sm font-medium toi:bg-black/30"
                    >
                      Sửa {ci.byId.get(id)?.hoTen ?? id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'xuat-nhap' && (
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Đưa thẳng lên GitHub</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              Khai báo một lần trên mỗi máy, sau đó chỉ cần bấm một nút là dữ liệu lên mạng —
              không phải cài git, không phải chép file. Hợp cho người ở xa tự nhập liệu.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Tên tài khoản chủ kho
                </span>
                <input
                  value={kho.chuSoHuu}
                  onChange={(e) => datKhoTruong('chuSoHuu', e.target.value.trim())}
                  placeholder="vidu-nguyenvan"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Tên kho
                </span>
                <input
                  value={kho.kho}
                  onChange={(e) => datKhoTruong('kho', e.target.value.trim())}
                  placeholder="gia-pha"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Nhánh
                </span>
                <input
                  value={kho.nhanh}
                  onChange={(e) => datKhoTruong('nhanh', e.target.value.trim())}
                  placeholder="main"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Thư mục dữ liệu trong kho
                </span>
                <input
                  value={kho.thuMuc}
                  onChange={(e) => datKhoTruong('thuMuc', e.target.value.trim())}
                  placeholder="public"
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Mã truy cập GitHub
                </span>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => datToken(e.target.value.trim())}
                  autoComplete="off"
                  placeholder="github_pat_..."
                  className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
                />
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={ghBan || !token}
                  onClick={luuToken}
                  className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 toi:bg-stone-700"
                >
                  Cất mã, khoá bằng mã quản trị
                </button>
                {kho.tokenMaHoa && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm('Xoá mã truy cập khỏi máy này?')) return;
                      datKho(xoaToken(kho));
                      datToken('');
                      datThongBao('Đã xoá mã truy cập khỏi máy này.');
                    }}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-red-700 toi:text-red-400"
                  >
                    Xoá mã truy cập
                  </button>
                )}
                <span className="text-sm text-stone-500">
                  {kho.tokenMaHoa
                    ? token
                      ? 'Đã cất trong máy, hiện đang mở khoá.'
                      : 'Đã cất trong máy nhưng chưa mở được — mã quản trị không khớp.'
                    : 'Chưa cất mã nào trong máy này.'}
                </span>
              </div>
              {!gp.dongHo.maQuanTri && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 toi:bg-amber-950 toi:text-amber-200">
                  Chưa đặt mã quản trị nên chưa cất được mã truy cập. Sang thẻ{' '}
                  <button
                    type="button"
                    onClick={() => datTab('bao-mat')}
                    className="!min-h-0 font-semibold underline"
                  >
                    Bảo mật
                  </button>{' '}
                  đặt mã quản trị trước.
                </p>
              )}
            </div>

            {ghLoi && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-300 toi:bg-red-950 toi:text-red-300 toi:ring-red-900">
                {ghLoi}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={ghBan || !sanSangDay(cauHinhDay)}
                onClick={dayLen}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 font-medium text-white disabled:opacity-40"
              >
                {ghBan ? 'Đang gửi...' : 'Đưa lên mạng ngay'}
              </button>
              <button
                type="button"
                disabled={ghBan || !sanSangDay(cauHinhDay)}
                onClick={thuKetNoi}
                className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium disabled:opacity-40 toi:bg-stone-800"
              >
                Thử kết nối
              </button>
              {daKhaiKho(kho) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Xoá toàn bộ khai báo GitHub khỏi máy này?')) return;
                    xoaKho();
                    datKho(KHO_TRONG);
                    datToken('');
                    datThongBao('Đã xoá khai báo GitHub khỏi máy này.');
                  }}
                  className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 toi:bg-red-950 toi:text-red-300"
                >
                  Xoá khỏi máy này
                </button>
              )}
            </div>

            <details className="text-sm text-stone-600 toi:text-stone-400">
              <summary className="cursor-pointer font-medium">Cách lấy mã truy cập</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  Vào <code>github.com</code> → ảnh đại diện → Settings → Developer settings →
                  Personal access tokens → Fine-grained tokens → Generate new token.
                </li>
                <li>Phần Repository access: chọn Only select repositories, chọn đúng kho gia phả.</li>
                <li>
                  Phần Permissions → Repository permissions → <strong>Contents</strong>: chọn{' '}
                  <strong>Read and write</strong>.
                </li>
                <li>Đặt hạn dùng (ví dụ 1 năm), bấm Generate rồi chép mã dán vào ô trên.</li>
              </ol>
              <p className="mt-2">
                Mã được cất trong trình duyệt máy này dưới dạng đã mã hoá bằng mã quản trị, và
                không bao giờ được ghi vào file gia phả. Người không có mã quản trị dù ngồi đúng máy
                này cũng không lấy mã ra dùng được.
              </p>
            </details>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Xuất dữ liệu</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              Mọi thay đổi hiện đang nằm trong trình duyệt của máy này. Muốn đưa lên website cho cả
              họ xem thì phải xuất ra file rồi chép vào thư mục <code>public/</code> của mã nguồn.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  xuatZip(gp, matKhauXem).then(() =>
                    datThongBao(
                      matKhauXem
                        ? 'Đã tải file nén. Dữ liệu bên trong đã được mã hoá bằng mật khẩu xem.'
                        : 'Đã tải file nén dữ liệu + ảnh. Lưu ý: dữ liệu chưa mã hoá.',
                    ),
                  )
                }
                className="rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white"
              >
                Xuất trọn bộ (.zip có ảnh)
              </button>
              <button
                type="button"
                onClick={() =>
                  xuatJson(gp, matKhauXem).then(() =>
                    datThongBao(
                      matKhauXem ? 'Đã tải giapha.json (đã mã hoá).' : 'Đã tải giapha.json.',
                    ),
                  )
                }
                className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
              >
                Chỉ xuất giapha.json
              </button>
            </div>
            {hoTroGhiThuMuc() && (
              <button
                type="button"
                onClick={() =>
                  ghiVaoThuMuc(gp, matKhauXem)
                    .then(datThongBao)
                    .catch((e: unknown) =>
                      datThongBao(`Không ghi được: ${e instanceof Error ? e.message : String(e)}`),
                    )
                }
                className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 font-medium text-white"
              >
                Ghi thẳng vào thư mục public/ trên máy
              </button>
            )}
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Nhập dữ liệu</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              Nhận file <code>.json</code>, <code>.zip</code> đã xuất trước đó, hoặc <code>.csv</code>{' '}
              gõ hàng loạt từ gia phả giấy.
            </p>
            <input
              ref={oTep}
              type="file"
              accept=".json,.zip,.csv"
              onChange={(e) => {
                const t = e.target.files?.[0];
                if (t) nhapFile(t);
                if (oTep.current) oTep.current.value = '';
              }}
              className="w-full rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            />
            <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-3 toi:border-stone-800">
              <button
                type="button"
                onClick={napDuLieuMau}
                className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
              >
                Nạp dữ liệu mẫu để xem thử
              </button>
              <button
                type="button"
                onClick={xoaTatCa}
                disabled={gp.nguoi.length === 0}
                className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 disabled:opacity-40 toi:bg-red-950 toi:text-red-300"
              >
                Xoá sạch để nhập lại từ đầu
              </button>
            </div>

            <details className="text-sm text-stone-600 toi:text-stone-400">
              <summary className="cursor-pointer font-medium">Định dạng file CSV</summary>
              <p className="mt-2">Dòng đầu là tên cột, dùng đúng các tên sau:</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-stone-100 p-2 text-xs toi:bg-stone-950">
                id,hoTen,gioiTinh,chaId,meId,thuTu,chiNhanh,sinh,mat,gioNgay,gioThang,queQuan,ngheNghiep,congDuc,ghiChu
              </pre>
              <p className="mt-2">
                <code>gioiTinh</code> ghi <code>nam</code> / <code>nu</code>. <code>sinh</code> và{' '}
                <code>mat</code> ghi dạng <code>1943-05-12</code> hoặc chỉ <code>1943</code>. Dòng
                nào có <code>id</code> trùng người đã có thì cập nhật đè lên người đó.
              </p>
            </details>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="font-semibold">Bản nháp</h2>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              {tuBanNhap
                ? 'Đang có bản nháp chưa xuất. Bỏ bản nháp sẽ quay về đúng dữ liệu trên website.'
                : 'Chưa có thay đổi nào so với dữ liệu trên website.'}
            </p>
            <button
              type="button"
              disabled={!tuBanNhap}
              onClick={() => {
                if (confirm('Bỏ toàn bộ thay đổi chưa xuất và nạp lại dữ liệu gốc?')) boBanNhap();
              }}
              className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 disabled:opacity-40 toi:bg-red-950 toi:text-red-300"
            >
              Bỏ bản nháp, nạp lại dữ liệu gốc
            </button>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <h2 className="mb-2 font-semibold">In gia phả</h2>
            <Link
              to="/in"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
            >
              <Icon ten="in" className="size-5" />
              Mở bản in / xuất PDF
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
