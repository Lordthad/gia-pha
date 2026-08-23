import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChiMuc, useGiaPha } from '../boiCanh/GiaPhaContext';
import AnhNguoi from '../components/AnhNguoi';
import CayGiaPha, { nguoiTrongSoDo } from '../components/CayGiaPha';
import ChonNguoi from '../components/ChonNguoi';
import Icon from '../components/Icon';
import ThemNhanh, { type DuLieuNhanh } from '../components/ThemNhanh';
import { conCuaNguoi, khoangNam, voChongCua, type ChiMuc } from '../lib/chiMuc';
import { maMoi } from '../lib/luuTru';
import { toTienCua } from '../lib/xungHo';
import type { HonNhan, ID, Person } from '../types/giapha';

type CheDo = 'so-do' | 'danh-sach' | 'truc-he';

type HopThoai =
  | { loai: 'them-thuy-to' }
  | { loai: 'them-con'; nguoiId: ID }
  | { loai: 'them-ban-doi'; nguoiId: ID }
  | { loai: 'them-cha-me'; nguoiId: ID }
  | { loai: 'sua'; nguoiId: ID };

const TOAN_BO = 99;

/** Một nhánh trong chế độ danh sách: bấm để mở/đóng. */
function NhanhDanhSach({ ci, id, mucDo }: { ci: ChiMuc; id: ID; mucDo: number }) {
  const [mo, datMo] = useState(mucDo < 2);
  const p = ci.byId.get(id);
  if (!p) return null;
  const con = conCuaNguoi(ci, id);
  const banDoi = voChongCua(ci, id).map((x) => x.nguoi);

  return (
    <li>
      <div className="flex items-center gap-2 rounded-xl bg-white px-2 py-2 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <button
          type="button"
          onClick={() => datMo((x) => !x)}
          disabled={con.length === 0}
          aria-label={mo ? 'Thu gọn' : 'Mở rộng'}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-500 disabled:opacity-25 toi:text-stone-400"
        >
          <Icon ten={mo ? 'thu-gon' : 'mo-rong'} className="size-5" />
        </button>
        <Link to={`/nguoi/${p.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <AnhNguoi nguoi={p} co="nho" />
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {p.hoTen}
              {banDoi.length > 0 && (
                <span className="font-normal text-stone-500 toi:text-stone-400">
                  {' '}
                  — {banDoi.map((v) => v.hoTen).join(', ')}
                </span>
              )}
            </span>
            <span className="block truncate text-sm text-stone-500 toi:text-stone-400">
              Đời {ci.doi.get(p.id)}
              {khoangNam(p) && ` · ${khoangNam(p)}`}
              {con.length > 0 && ` · ${con.length} người con`}
            </span>
          </span>
        </Link>
      </div>
      {mo && con.length > 0 && (
        <ul className="mt-2 space-y-2 border-l-2 border-stone-200 pl-3 toi:border-stone-800">
          {con.map((c) => (
            <NhanhDanhSach key={c.id} ci={ci} id={c.id} mucDo={mucDo + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TrangCay() {
  const { id } = useParams();
  const ci = useChiMuc();
  const { giaPha, capNhat } = useGiaPha();
  const dieuHuong = useNavigate();

  const macDinh = giaPha?.dongHo.thuyToId ?? ci.giaPha.nguoi[0]?.id;
  const gocId = id && ci.byId.has(id) ? id : macDinh;

  const [cheDo, datCheDo] = useState<CheDo>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'danh-sach' : 'so-do',
  );
  const [soDoi, datSoDoi] = useState(3);
  const [phongTo, datPhongTo] = useState(1);
  const [cheDoSua, datCheDoSua] = useState(false);
  const [chiConTrai, datChiConTrai] = useState(false);
  const [hopThoai, datHopThoai] = useState<HopThoai>();
  const [rongCay, datRongCay] = useState(0);
  const khung = useRef<HTMLDivElement>(null);

  useEffect(() => {
    datPhongTo(1);
  }, [gocId, soDoi, chiConTrai]);

  const nhanKichThuoc = useCallback((r: number) => datRongCay(r), []);

  const vuaKhung = () => {
    const rongKhung = (khung.current?.clientWidth ?? 0) - 8;
    if (rongKhung > 0 && rongCay > 0) {
      datPhongTo(Math.max(0.1, Math.min(2.5, +(rongKhung / rongCay).toFixed(2))));
    }
  };

  // Nói rõ sơ đồ rút gọn đã lược đi bao nhiêu người, tránh hiểu nhầm là mất dữ liệu.
  const soNguoiLuoc = useMemo(() => {
    if (!gocId || !chiConTrai) return 0;
    const day = nguoiTrongSoDo(ci, gocId, soDoi, false).size;
    const gon = nguoiTrongSoDo(ci, gocId, soDoi, true).size;
    return Math.max(0, day - gon);
  }, [ci, gocId, soDoi, chiConTrai]);

  const trucHe = useMemo(() => {
    if (!gocId) return [];
    return [...toTienCua(ci, gocId).entries()]
      .sort((a, b) => a[1].buoc - b[1].buoc)
      .map(([pid, d]) => ({ nguoi: ci.byId.get(pid)!, buoc: d.buoc }))
      .filter((x): x is { nguoi: Person; buoc: number } => Boolean(x.nguoi));
  }, [ci, gocId]);

  const gp = giaPha!;
  const nguoiHopThoai =
    hopThoai && 'nguoiId' in hopThoai ? ci.byId.get(hopThoai.nguoiId) : undefined;

  /* ---------- Các thao tác nhập trực tiếp trên sơ đồ ---------- */

  const taoNguoi = (d: DuLieuNhanh, mau?: Person): Person => {
    const p: Person = {
      id: maMoi(gp.nguoi.map((x) => x.id)),
      hoTen: d.hoTen,
      gioiTinh: d.gioiTinh,
    };
    if (d.namSinh) p.sinh = { duong: String(d.namSinh).padStart(4, '0') };
    if (d.thuTu != null) p.thuTu = d.thuTu;
    if (mau?.chiNhanh) p.chiNhanh = mau.chiNhanh;
    if (mau?.queQuan) p.queQuan = mau.queQuan;
    return p;
  };

  /** Người đầu tiên của gia phả, đồng thời được đặt làm thuỷ tổ. */
  const themThuyTo = (d: DuLieuNhanh) => {
    const p = taoNguoi(d);
    capNhat({ ...gp, nguoi: [p], dongHo: { ...gp.dongHo, thuyToId: p.id } });
    dieuHuong(`/cay/${p.id}`);
  };

  // Gia phả còn trống: mời người dùng dựng người đầu tiên.
  if (!gocId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Cây gia phả</h1>
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <Icon ten="cay" className="mx-auto size-10 text-amber-800 toi:text-amber-500" />
          <h2 className="mt-3 font-serif text-lg font-semibold">Gia phả chưa có người nào</h2>
          <p className="mx-auto mt-1 max-w-md text-stone-600 toi:text-stone-400">
            Bắt đầu bằng cụ thuỷ tổ — người xa đời nhất mà dòng họ còn biết tên. Những người sau
            thêm dần bằng các nút ngay trên sơ đồ.
          </p>
          <button
            type="button"
            onClick={() => datHopThoai({ loai: 'them-thuy-to' })}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-5 py-2.5 font-medium text-white"
          >
            <Icon ten="them" className="size-5" />
            Thêm cụ thuỷ tổ
          </button>
          <p className="mt-4 text-sm text-stone-500">
            Muốn xem thử phần mềm chạy ra sao thì vào{' '}
            <Link to="/quan-tri" className="font-medium text-amber-800 toi:text-amber-400">
              Quản trị → Xuất / Nhập
            </Link>{' '}
            và bấm “Nạp dữ liệu mẫu”.
          </p>
        </div>

        {hopThoai?.loai === 'them-thuy-to' && (
          <ThemNhanh
            tieuDe="Thêm cụ thuỷ tổ"
            moTa="Người này sẽ được tính là đời thứ nhất của dòng họ."
            onLuu={(d) => {
              themThuyTo(d);
              datHopThoai(undefined);
            }}
            onDong={() => datHopThoai(undefined)}
          />
        )}
      </div>
    );
  }

  const goc = ci.byId.get(gocId)!;

  const themCon = (chaMeId: ID, d: DuLieuNhanh) => {
    const cm = ci.byId.get(chaMeId)!;
    const con = taoNguoi(d, cm);
    if (cm.gioiTinh === 'nu') {
      con.meId = chaMeId;
      con.chaId = d.chaMeKia ?? null;
    } else {
      con.chaId = chaMeId;
      con.meId = d.chaMeKia ?? null;
    }
    if (con.thuTu == null) con.thuTu = (ci.conCua.get(chaMeId)?.length ?? 0) + 1;
    capNhat({ ...gp, nguoi: [...gp.nguoi, con] });
  };

  const themBanDoi = (nguoiId: ID, d: DuLieuNhanh) => {
    const ng = ci.byId.get(nguoiId)!;
    const moi = taoNguoi(d, ng);
    const laVo = moi.gioiTinh !== 'nam';
    const hn: HonNhan = {
      id: `H${Date.now().toString(36)}`,
      chongId: laVo ? nguoiId : moi.id,
      voId: laVo ? moi.id : nguoiId,
      thuTu: d.thuTuVo ?? (ci.honNhanCua.get(nguoiId)?.length ?? 0) + 1,
    };
    capNhat({ ...gp, nguoi: [...gp.nguoi, moi], honNhan: [...gp.honNhan, hn] });
  };

  const themChaMe = (conId: ID, d: DuLieuNhanh) => {
    const con = ci.byId.get(conId)!;
    const moi = taoNguoi(d, con);
    const laMe = moi.gioiTinh !== 'nam';
    const conMoi: Person = laMe ? { ...con, meId: moi.id } : { ...con, chaId: moi.id };

    // Nếu người con đã có cha (hoặc mẹ) thì nối luôn hai người thành vợ chồng.
    const kiaId = laMe ? con.chaId : con.meId;
    const honNhan = [...gp.honNhan];
    if (kiaId && ci.byId.has(kiaId)) {
      honNhan.push({
        id: `H${Date.now().toString(36)}`,
        chongId: laMe ? kiaId : moi.id,
        voId: laMe ? moi.id : kiaId,
        thuTu: (ci.honNhanCua.get(kiaId)?.length ?? 0) + 1,
      });
    }
    capNhat({
      ...gp,
      nguoi: [...gp.nguoi.map((x) => (x.id === conId ? conMoi : x)), moi],
      honNhan,
    });
    // Người mới trở thành gốc để tiếp tục dựng ngược lên.
    dieuHuong(`/cay/${moi.id}`);
  };

  const luuSua = (nguoiId: ID, d: DuLieuNhanh) => {
    const cu = ci.byId.get(nguoiId)!;
    const moi: Person = {
      ...cu,
      hoTen: d.hoTen,
      gioiTinh: d.gioiTinh,
      thuTu: d.thuTu,
      sinh: d.namSinh ? { ...cu.sinh, duong: String(d.namSinh).padStart(4, '0') } : cu.sinh,
    };
    capNhat({ ...gp, nguoi: gp.nguoi.map((x) => (x.id === nguoiId ? moi : x)) });
  };

  const xuLyLuu = (d: DuLieuNhanh) => {
    if (!hopThoai) return;
    switch (hopThoai.loai) {
      case 'them-thuy-to':
        themThuyTo(d);
        break;
      case 'them-con':
        themCon(hopThoai.nguoiId, d);
        break;
      case 'them-ban-doi':
        themBanDoi(hopThoai.nguoiId, d);
        break;
      case 'them-cha-me':
        themChaMe(hopThoai.nguoiId, d);
        break;
      case 'sua':
        luuSua(hopThoai.nguoiId, d);
        break;
    }
    datHopThoai(undefined);
  };

  /* ---------- Nội dung hộp thoại theo từng thao tác ---------- */

  const dungHopThoai = () => {
    if (!hopThoai || !nguoiHopThoai) return null;
    const ng = nguoiHopThoai;
    const chung = {
      onLuu: xuLyLuu,
      onDong: () => datHopThoai(undefined),
    };

    if (hopThoai.loai === 'them-con') {
      const banDoi = voChongCua(ci, ng.id).map((x) => x.nguoi);
      return (
        <ThemNhanh
          {...chung}
          tieuDe={`Thêm con cho ${ng.hoTen}`}
          moTa={
            banDoi.length > 1
              ? 'Nhớ chọn đúng mẹ để phần mềm phân biệt được con vợ cả với con vợ thứ.'
              : 'Con sẽ được nối vào cây ngay sau khi lưu.'
          }
          chonChaMeKia={banDoi}
          nhanChaMeKia={ng.gioiTinh === 'nu' ? 'Cha là' : 'Mẹ là'}
          banDau={{ thuTu: (ci.conCua.get(ng.id)?.length ?? 0) + 1 }}
        />
      );
    }

    if (hopThoai.loai === 'them-ban-doi') {
      const soHienCo = ci.honNhanCua.get(ng.id)?.length ?? 0;
      return (
        <ThemNhanh
          {...chung}
          tieuDe={`Thêm ${ng.gioiTinh === 'nu' ? 'chồng' : 'vợ'} cho ${ng.hoTen}`}
          moTa={
            soHienCo > 0
              ? 'Người này đã có bạn đời. Chọn đúng thứ tự vì con vợ cả luôn ở vai anh/chị.'
              : undefined
          }
          banDau={{ gioiTinh: ng.gioiTinh === 'nu' ? 'nam' : 'nu' }}
          hoiThuTuVo={soHienCo + 1}
        />
      );
    }

    if (hopThoai.loai === 'them-cha-me') {
      return (
        <ThemNhanh
          {...chung}
          tieuDe={`Thêm cha hoặc mẹ cho ${ng.hoTen}`}
          moTa="Chọn Nam để thêm cha, chọn Nữ để thêm mẹ. Sơ đồ sẽ chuyển gốc lên người vừa thêm."
          banDau={{ gioiTinh: ng.chaId ? 'nu' : 'nam' }}
        />
      );
    }

    return (
      <ThemNhanh
        {...chung}
        tieuDe={`Sửa nhanh: ${ng.hoTen || 'người chưa đặt tên'}`}
        moTa="Cần nhập đầy đủ ngày giỗ, mộ phần, ảnh... thì bấm Form đầy đủ."
        banDau={{
          hoTen: ng.hoTen,
          gioiTinh: ng.gioiTinh,
          namSinh: ng.sinh?.duong ? Number(ng.sinh.duong.slice(0, 4)) : undefined,
          thuTu: ng.thuTu,
        }}
        onFormDayDu={() => dieuHuong(`/quan-tri?sua=${ng.id}`)}
      />
    );
  };

  const lopNut = (dang: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
      dang
        ? 'bg-white text-amber-900 shadow-sm toi:bg-stone-700 toi:text-amber-300'
        : 'text-stone-600 toi:text-stone-400'
    }`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Cây gia phả</h1>

      <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <ChonNguoi nhan="Xem từ người" giaTri={gocId} onChon={(x) => x && dieuHuong(`/cay/${x}`)} />
        {giaPha?.dongHo.thuyToId && gocId !== giaPha.dongHo.thuyToId && (
          <button
            type="button"
            onClick={() => dieuHuong(`/cay/${giaPha.dongHo.thuyToId}`)}
            className="text-sm font-medium text-amber-800 toi:text-amber-400"
          >
            ← Về thuỷ tổ
          </button>
        )}

        <div className="flex rounded-xl bg-stone-100 p-1 toi:bg-stone-800">
          <button type="button" onClick={() => datCheDo('so-do')} className={lopNut(cheDo === 'so-do')}>
            Sơ đồ
          </button>
          <button
            type="button"
            onClick={() => datCheDo('danh-sach')}
            className={lopNut(cheDo === 'danh-sach')}
          >
            Danh sách
          </button>
          <button
            type="button"
            onClick={() => datCheDo('truc-he')}
            className={lopNut(cheDo === 'truc-he')}
          >
            Trực hệ
          </button>
        </div>

        {cheDo === 'so-do' && (
          <>
            <div className="flex rounded-xl bg-stone-100 p-1 toi:bg-stone-800">
              <button
                type="button"
                onClick={() => datChiConTrai(false)}
                className={lopNut(!chiConTrai)}
              >
                Sơ đồ đầy đủ
              </button>
              <button
                type="button"
                onClick={() => datChiConTrai(true)}
                className={lopNut(chiConTrai)}
              >
                Sơ đồ rút gọn
              </button>
            </div>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              {chiConTrai
                ? 'Chỉ hiện dòng nam nối dõi, theo lối gia phả nội tộc: bỏ vợ, con gái và con rể.'
                : 'Hiện đủ cả nam lẫn nữ, kèm vợ chồng của từng người.'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-stone-600 toi:text-stone-400">Hiển thị</span>
                <select
                  value={soDoi}
                  onChange={(e) => datSoDoi(Number(e.target.value))}
                  className="rounded-lg bg-stone-50 px-2 py-1.5 ring-1 ring-stone-300 toi:bg-stone-800 toi:ring-stone-700"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} đời
                    </option>
                  ))}
                  <option value={TOAN_BO}>Toàn bộ cây</option>
                </select>
              </label>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={vuaKhung}
                  className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium toi:bg-stone-800"
                >
                  Vừa khung
                </button>
                <button
                  type="button"
                  onClick={() => datPhongTo((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))}
                  className="size-10 rounded-lg bg-stone-100 text-lg font-semibold toi:bg-stone-800"
                  aria-label="Thu nhỏ"
                >
                  −
                </button>
                <span className="w-14 text-center text-sm text-stone-600 toi:text-stone-400">
                  {Math.round(phongTo * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => datPhongTo((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
                  className="size-10 rounded-lg bg-stone-100 text-lg font-semibold toi:bg-stone-800"
                  aria-label="Phóng to"
                >
                  +
                </button>
              </div>
            </div>

            <label
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ${
                cheDoSua
                  ? 'bg-amber-50 ring-amber-400 toi:bg-amber-950/50 toi:ring-amber-700'
                  : 'bg-stone-50 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800'
              }`}
            >
              <input
                type="checkbox"
                checked={cheDoSua}
                onChange={(e) => datCheDoSua(e.target.checked)}
                className="!min-h-0 size-5"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Nhập dữ liệu ngay trên sơ đồ</span>
                <span className="block text-sm text-stone-600 toi:text-stone-400">
                  Hiện các nút thêm con, thêm vợ/chồng, thêm cha mẹ; bấm vào một người để sửa nhanh.
                </span>
              </span>
            </label>
          </>
        )}
      </div>

      {cheDo === 'so-do' && (
        <>
          <div ref={khung}>
            <CayGiaPha
              ci={ci}
              gocId={gocId}
              soDoi={soDoi}
              phongTo={phongTo}
              onChonGoc={(x) => dieuHuong(`/cay/${x}`)}
              onKichThuoc={nhanKichThuoc}
              chiConTrai={chiConTrai}
              cheDoSua={cheDoSua}
              onSua={(x) => datHopThoai({ loai: 'sua', nguoiId: x })}
              onThemCon={(x) => datHopThoai({ loai: 'them-con', nguoiId: x })}
              onThemBanDoi={(x) => datHopThoai({ loai: 'them-ban-doi', nguoiId: x })}
              onThemChaMe={(x) => datHopThoai({ loai: 'them-cha-me', nguoiId: x })}
            />
          </div>
          <p className="text-center text-sm text-stone-500 toi:text-stone-400">
            {cheDoSua
              ? 'Mọi thay đổi lưu vào bản nháp trong máy. Vào Quản trị → Xuất / Nhập để đưa lên website.'
              : 'Kéo ngang để xem hết cây. Bấm vào một người để mở hồ sơ, bấm “+ người con” để xem tiếp nhánh đó.'}
          </p>
          {chiConTrai && soNguoiLuoc > 0 && (
            <p className="text-center text-sm text-stone-500 toi:text-stone-400">
              Sơ đồ này lược đi {soNguoiLuoc} người (vợ, con gái, con rể). Họ vẫn còn nguyên trong
              gia phả — xem ở{' '}
              <button
                type="button"
                onClick={() => datChiConTrai(false)}
                className="!min-h-0 font-medium text-amber-800 underline toi:text-amber-400"
              >
                sơ đồ đầy đủ
              </button>
              .
            </p>
          )}
        </>
      )}

      {cheDo === 'danh-sach' && (
        <ul className="space-y-2">
          <NhanhDanhSach ci={ci} id={gocId} mucDo={0} />
        </ul>
      )}

      {cheDo === 'truc-he' && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <h2 className="mb-3 font-semibold">
            Đường trực hệ của {goc.hoTen} ({trucHe.length} đời)
          </h2>
          <ol className="space-y-2">
            {[...trucHe].reverse().map((x) => (
              <li key={x.nguoi.id} style={{ paddingLeft: `${(trucHe.length - 1 - x.buoc) * 14}px` }}>
                <Link
                  to={`/nguoi/${x.nguoi.id}`}
                  className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 toi:bg-stone-800 toi:ring-stone-700"
                >
                  <AnhNguoi nguoi={x.nguoi} co="nho" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{x.nguoi.hoTen}</span>
                    <span className="block text-sm text-stone-500 toi:text-stone-400">
                      Đời {ci.doi.get(x.nguoi.id)}
                      {x.buoc === 0 ? ' · chính người này' : ` · trên ${x.buoc} đời`}
                      {khoangNam(x.nguoi) && ` · ${khoangNam(x.nguoi)}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {dungHopThoai()}
    </div>
  );
}
