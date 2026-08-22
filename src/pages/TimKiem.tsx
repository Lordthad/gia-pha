import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import Icon from '../components/Icon';
import { DanhSachNguoi } from '../components/TheNguoi';
import { cacChiNhanh, cacDoi, timNguoi, type BoLoc } from '../lib/timKiem';
import type { GioiTinh } from '../types/giapha';

export default function TimKiem() {
  const ci = useChiMuc();
  const [thamSo, datThamSo] = useSearchParams();
  const [hienLoc, datHienLoc] = useState(false);

  const tuKhoa = thamSo.get('q') ?? '';
  const doi = thamSo.get('doi');
  const chi = thamSo.get('chi');
  const gioiTinh = thamSo.get('gt') as GioiTinh | null;
  const trangThai = thamSo.get('tt') as BoLoc['trangThai'] | null;

  const dat = (khoa: string, gt: string) => {
    const moi = new URLSearchParams(thamSo);
    if (gt) moi.set(khoa, gt);
    else moi.delete(khoa);
    datThamSo(moi, { replace: true });
  };

  const ketQua = useMemo(
    () =>
      timNguoi(ci, {
        tuKhoa: tuKhoa || undefined,
        doi: doi ? Number(doi) : undefined,
        chiNhanh: chi ?? undefined,
        gioiTinh: gioiTinh ?? undefined,
        trangThai: trangThai ?? undefined,
      }),
    [ci, tuKhoa, doi, chi, gioiTinh, trangThai],
  );

  const soLoc = [doi, chi, gioiTinh, trangThai].filter(Boolean).length;
  const lopChon =
    'w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700';

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tra cứu người trong họ</h1>

      <div className="relative">
        <Icon
          ten="kinh-lup"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-400"
        />
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => dat('q', e.target.value)}
          placeholder="Tên, tên thường gọi, quê quán, nghề nghiệp..."
          className="w-full rounded-xl bg-white py-3 pr-4 pl-11 ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => datHienLoc((x) => !x)}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700"
        >
          <Icon ten={hienLoc ? 'thu-gon' : 'mo-rong'} className="size-4" />
          Bộ lọc
          {soLoc > 0 && (
            <span className="rounded-full bg-amber-800 px-1.5 text-xs text-white">{soLoc}</span>
          )}
        </button>
        <span className="text-sm text-stone-500 toi:text-stone-400">
          {ketQua.length} người
        </span>
        {soLoc > 0 && (
          <button
            type="button"
            onClick={() => datThamSo(tuKhoa ? { q: tuKhoa } : {}, { replace: true })}
            className="ml-auto text-sm font-medium text-amber-800 toi:text-amber-400"
          >
            Xoá lọc
          </button>
        )}
      </div>

      {hienLoc && (
        <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:grid-cols-2 toi:bg-stone-900 toi:ring-stone-800">
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600 toi:text-stone-400">Đời</span>
            <select value={doi ?? ''} onChange={(e) => dat('doi', e.target.value)} className={lopChon}>
              <option value="">Tất cả</option>
              {cacDoi(ci).map((d) => (
                <option key={d} value={d}>
                  Đời {d} ({ci.theoDoi.get(d)?.length} người)
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-stone-600 toi:text-stone-400">Chi / nhánh</span>
            <select value={chi ?? ''} onChange={(e) => dat('chi', e.target.value)} className={lopChon}>
              <option value="">Tất cả</option>
              {cacChiNhanh(ci).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-stone-600 toi:text-stone-400">Giới tính</span>
            <select value={gioiTinh ?? ''} onChange={(e) => dat('gt', e.target.value)} className={lopChon}>
              <option value="">Tất cả</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-stone-600 toi:text-stone-400">Tình trạng</span>
            <select value={trangThai ?? ''} onChange={(e) => dat('tt', e.target.value)} className={lopChon}>
              <option value="">Tất cả</option>
              <option value="con-song">Còn sống</option>
              <option value="da-mat">Đã mất</option>
            </select>
          </label>
        </div>
      )}

      <DanhSachNguoi
        ds={ketQua}
        rong="Không tìm thấy ai. Thử gõ ít chữ hơn, hoặc bỏ bớt bộ lọc."
      />
    </div>
  );
}
