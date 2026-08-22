import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import AnhNguoi, { useDuongDanAnh } from '../components/AnhNguoi';
import Icon from '../components/Icon';
import { DanhSachNguoi } from '../components/TheNguoi';
import { canChiNam, chuoiDuongLich, conBaoNhieuNgay, gioKeTiep } from '../lib/amLich';
import {
  anhChiEmCua,
  chaCua,
  conCuaNguoi,
  daMat,
  khoangNam,
  layNam,
  meCua,
  voChongCua,
} from '../lib/chiMuc';
import { conBaoLau, ngayGioCua } from '../lib/gio';
import type { NgayThang, Person } from '../types/giapha';

function chuoiNgay(nt?: NgayThang): string | undefined {
  if (!nt) return undefined;
  const phan: string[] = [];
  if (nt.duong) {
    const [y, m, d] = nt.duong.split('-');
    phan.push(d ? `${d}/${m}/${y}` : m ? `tháng ${m}/${y}` : `năm ${y}`);
    if (y) phan.push(`(${canChiNam(Number(y))})`);
  }
  if (nt.am) {
    phan.push(`— ${nt.am.ngay}/${nt.am.thang}${nt.am.nhuan ? ' nhuận' : ''} âm lịch`);
  }
  if (nt.ghiChu) phan.push(`(${nt.ghiChu})`);
  if (phan.length === 0 && nt.khongRo) return 'không rõ';
  return phan.join(' ') || undefined;
}

function Muc({ nhan, gt }: { nhan: string; gt?: string }) {
  if (!gt) return null;
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-sm text-stone-500 toi:text-stone-400">{nhan}</dt>
      <dd className="min-w-0 flex-1">{gt}</dd>
    </div>
  );
}

function AnhTuLieu({ duongDan }: { duongDan: string }) {
  const url = useDuongDanAnh(duongDan);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img
        src={url}
        alt="Tư liệu"
        className="h-28 w-28 rounded-lg object-cover ring-1 ring-stone-300 toi:ring-stone-700"
      />
    </a>
  );
}

export default function HoSoNguoi() {
  const { id } = useParams();
  const ci = useChiMuc();
  const dieuHuong = useNavigate();
  const p = id ? ci.byId.get(id) : undefined;

  if (!p) {
    return (
      <div className="py-16 text-center">
        <p className="text-stone-500">Không tìm thấy người này trong gia phả.</p>
        <Link to="/tim-kiem" className="mt-3 inline-block font-medium text-amber-800">
          Về trang tra cứu
        </Link>
      </div>
    );
  }

  const doi = ci.doi.get(p.id);
  const cha = chaCua(ci, p.id);
  const me = meCua(ci, p.id);
  const banDoi = voChongCua(ci, p.id);
  const con = conCuaNguoi(ci, p.id);
  const anhEm = anhChiEmCua(ci, p.id);
  const gio = ngayGioCua(p);
  const ngayGio = gio ? gioKeTiep(gio) : undefined;

  const chaMe: Person[] = [cha, me].filter((x): x is Person => Boolean(x));
  const banDoiNguoi = banDoi.map((x) => x.nguoi);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => dieuHuong(-1)}
        className="khong-in -ml-2 flex items-center gap-1 text-sm font-medium text-stone-600 toi:text-stone-400"
      >
        <Icon ten="quay-lai" className="size-4" />
        Quay lại
      </button>

      <header className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <AnhNguoi nguoi={p} co="lon" />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold">{p.hoTen}</h1>
            {p.tenThuong && (
              <p className="text-stone-600 toi:text-stone-400">thường gọi {p.tenThuong}</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {doi != null && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-900 toi:bg-amber-950 toi:text-amber-300">
                  Đời {doi}
                </span>
              )}
              {p.chiNhanh && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm text-stone-700 toi:bg-stone-800 toi:text-stone-300">
                  {p.chiNhanh}
                </span>
              )}
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm text-stone-700 toi:bg-stone-800 toi:text-stone-300">
                {p.gioiTinh === 'nam' ? 'Nam' : p.gioiTinh === 'nu' ? 'Nữ' : 'Khác'}
              </span>
              {khoangNam(p) && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm text-stone-700 toi:bg-stone-800 toi:text-stone-300">
                  {khoangNam(p)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="khong-in mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to={`/vai-ve?a=${p.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-amber-50"
          >
            <Icon ten="vai-ve" className="size-5" />
            So vai vế với người khác
          </Link>
          <Link
            to={`/cay/${p.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 font-medium text-stone-800 toi:bg-stone-800 toi:text-stone-100"
          >
            <Icon ten="cay" className="size-5" />
            Xem trong cây gia phả
          </Link>
        </div>
      </header>

      {ngayGio && gio && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200 toi:bg-red-950/40 toi:ring-red-900">
          <Icon ten="nhang" className="size-6 shrink-0 text-red-700 toi:text-red-400" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-red-900 toi:text-red-200">
              Ngày giỗ: {gio.ngay} tháng {gio.thang}
              {gio.nhuan ? ' nhuận' : ''} âm lịch
            </div>
            <div className="text-sm text-red-800 toi:text-red-300">
              Năm nay nhằm {chuoiDuongLich(ngayGio)} · {conBaoLau(conBaoNhieuNgay(ngayGio))}
              {gio.suyRa && ' · quy đổi từ ngày mất dương lịch'}
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <h2 className="mb-2 text-lg font-semibold">Thông tin</h2>
        <dl className="divide-y divide-stone-100 toi:divide-stone-800">
          <Muc nhan="Tên húy" gt={p.tenHuy} />
          <Muc nhan="Tên tự, hiệu" gt={p.tenTu} />
          <Muc nhan="Ngày sinh" gt={chuoiNgay(p.sinh)} />
          <Muc nhan="Ngày mất" gt={chuoiNgay(p.mat)} />
          <Muc
            nhan="Hưởng thọ"
            gt={
              layNam(p.sinh) && layNam(p.mat)
                ? `${layNam(p.mat)! - layNam(p.sinh)!} tuổi`
                : undefined
            }
          />
          <Muc nhan="Quê quán" gt={p.queQuan} />
          <Muc nhan="Nơi ở" gt={p.noiO} />
          <Muc nhan="Nghề nghiệp" gt={p.ngheNghiep} />
          <Muc nhan="Học vấn" gt={p.hocVan} />
          <Muc nhan="Ghi chú" gt={p.ghiChu} />
          <Muc nhan="Nguồn" gt={p.nguon} />
          {!daMat(p) && !p.mat && <Muc nhan="Tình trạng" gt="Còn sống" />}
        </dl>
      </section>

      {p.congDuc && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <h2 className="mb-2 text-lg font-semibold">Tiểu sử, công đức</h2>
          <p className="font-serif whitespace-pre-line text-stone-700 toi:text-stone-300">
            {p.congDuc}
          </p>
        </section>
      )}

      {p.moPhan && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Icon ten="ban-do" className="size-5 text-stone-500" />
            Phần mộ
          </h2>
          <dl className="divide-y divide-stone-100 toi:divide-stone-800">
            <Muc nhan="Nghĩa trang" gt={p.moPhan.nghiaTrang} />
            <Muc nhan="Mô tả" gt={p.moPhan.moTa} />
            <Muc
              nhan="Toạ độ"
              gt={
                p.moPhan.lat != null && p.moPhan.lng != null
                  ? `${p.moPhan.lat}, ${p.moPhan.lng}`
                  : undefined
              }
            />
          </dl>
          {p.moPhan.lat != null && p.moPhan.lng != null && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${p.moPhan.lat},${p.moPhan.lng}`}
              target="_blank"
              rel="noreferrer"
              className="khong-in mt-3 inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 font-medium text-stone-800 toi:bg-stone-800 toi:text-stone-100"
            >
              <Icon ten="ban-do" className="size-5" />
              Mở bản đồ dẫn đường
            </a>
          )}
          {p.moPhan.anh && p.moPhan.anh.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.moPhan.anh.map((a) => (
                <AnhTuLieu key={a} duongDan={a} />
              ))}
            </div>
          )}
        </section>
      )}

      {p.anh && p.anh.length > 0 && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <h2 className="mb-3 text-lg font-semibold">Ảnh và tư liệu</h2>
          <div className="flex flex-wrap gap-2">
            {p.anh.map((a) => (
              <AnhTuLieu key={a} duongDan={a} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Quan hệ trong họ</h2>
        {[
          { nhan: 'Cha mẹ', ds: chaMe },
          { nhan: 'Vợ / chồng', ds: banDoiNguoi },
          { nhan: 'Anh chị em', ds: anhEm },
          { nhan: 'Con', ds: con },
        ].map((nhom) =>
          nhom.ds.length === 0 ? null : (
            <div key={nhom.nhan}>
              <h3 className="mb-2 text-sm font-medium text-stone-500 toi:text-stone-400">
                {nhom.nhan} ({nhom.ds.length})
              </h3>
              <DanhSachNguoi ds={nhom.ds} />
            </div>
          ),
        )}
        {chaMe.length === 0 && banDoiNguoi.length === 0 && anhEm.length === 0 && con.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-5 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
            Chưa ghi quan hệ nào cho người này.
          </p>
        )}
      </section>
    </div>
  );
}
