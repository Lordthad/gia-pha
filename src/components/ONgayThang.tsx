import { useMemo, useState } from 'react';
import { CAN, canChiNam, CHI, cacNamTheoCanChi } from '../lib/amLich';
import type { KhoangNam } from '../lib/uocNam';
import type { NgayThang } from '../types/giapha';

/**
 * Ô nhập ngày theo thứ tự quen thuộc: ngày / tháng / năm.
 * Chỉ nhận chữ số nên không gõ nhầm chữ vào được, mà vẫn cho phép ghi thiếu —
 * gia phả cũ thường chỉ còn nhớ mỗi năm, hoặc thậm chí không nhớ năm nào cả.
 */

const KHONG_NAM = '????';

function tach(duong?: string): { ngay: string; thang: string; nam: string } {
  if (!duong) return { ngay: '', thang: '', nam: '' };
  const [y = '', m = '', d = ''] = duong.split('-');
  return { ngay: d, thang: m, nam: y === KHONG_NAM ? '' : y };
}

/**
 * Ghép lại thành chuỗi lưu trữ: 1943-05-12, 1943-05, 1943.
 * Nhớ ngày tháng mà quên năm thì thành ????-05-12 — vẫn giữ được phần đã nhớ.
 */
function ghep(ngay: string, thang: string, nam: string): string | undefined {
  if (!nam && !thang) return undefined;
  const y = nam ? nam.padStart(4, '0') : KHONG_NAM;
  if (!thang) return nam ? y : undefined;
  const m = thang.padStart(2, '0');
  if (!ngay) return `${y}-${m}`;
  return `${y}-${m}-${ngay.padStart(2, '0')}`;
}

function soNgayTrongThang(thang: number, nam: number): number {
  return new Date(nam, thang, 0).getDate();
}

/** Câu nhắc khi người dùng ghi thiếu hoặc ghi ngày không có thật. */
function loiNhap(ngay: string, thang: string, nam: string): string | undefined {
  const n = Number(ngay);
  const t = Number(thang);
  const y = Number(nam);
  if (ngay && !thang) return 'Cần ghi tháng thì ngày mới lưu được.';
  if (thang && (t < 1 || t > 12)) return 'Tháng phải từ 1 đến 12.';
  if (ngay && (n < 1 || n > 31)) return 'Ngày phải từ 1 đến 31.';
  if (ngay && thang && nam && t >= 1 && t <= 12 && n > soNgayTrongThang(t, y)) {
    return `Tháng ${t} năm ${y} chỉ có ${soNgayTrongThang(t, y)} ngày.`;
  }
  if (nam && (y < 1000 || y > 2200)) return 'Năm trông không hợp lý, xem lại giúp.';
  return undefined;
}

const O =
  'rounded-xl bg-white px-3 py-2.5 text-center tabular-nums ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700';
const O_CHON =
  'rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700';

interface Props {
  nhan: string;
  giaTri?: NgayThang;
  onDoi: (nt?: NgayThang) => void;
  goiY?: string;
  /** Khoảng năm ước chừng, dùng để lần ra năm dương lịch từ can chi. */
  khoangUoc?: KhoangNam;
}

export default function ONgayThang({ nhan, giaTri, onDoi, goiY, khoangUoc }: Props) {
  const [o, datO] = useState(() => tach(giaTri?.duong));
  const [moCanChi, datMoCanChi] = useState(false);
  const [can, datCan] = useState(CAN[0]);
  const [chi, datChi] = useState(CHI[0]);

  const khongRo = Boolean(giaTri?.khongRo);
  const ghiChu = giaTri?.ghiChu ?? '';

  const capNhat = (moi: Partial<NgayThang>) => {
    const gop: NgayThang = { ...giaTri, ...moi };
    const conGi = gop.duong || gop.ghiChu || gop.khongRo || gop.am;
    onDoi(conGi ? gop : undefined);
  };

  const doiSo = (phan: 'ngay' | 'thang' | 'nam', chu: string) => {
    const so = chu.replace(/\D/g, '').slice(0, phan === 'nam' ? 4 : 2);
    const moi = { ...o, [phan]: so };
    datO(moi);
    capNhat({ duong: ghep(moi.ngay, moi.thang, moi.nam) });
  };

  const namUngVien = useMemo(() => {
    if (!moCanChi) return [];
    const k = khoangUoc ?? { tu: 1700, den: new Date().getFullYear(), canCu: '' };
    return cacNamTheoCanChi(can, chi, k.tu, k.den);
  }, [moCanChi, can, chi, khoangUoc]);

  const chonNam = (nam: number) => {
    const moi = { ...o, nam: String(nam) };
    datO(moi);
    capNhat({ duong: ghep(moi.ngay, moi.thang, moi.nam), khongRo: undefined });
    datMoCanChi(false);
  };

  const loi = loiNhap(o.ngay, o.thang, o.nam);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
        {nhan}
      </span>

      <div className="flex items-center gap-2">
        <input
          value={o.ngay}
          onChange={(e) => doiSo('ngay', e.target.value)}
          inputMode="numeric"
          placeholder="Ngày"
          aria-label={`${nhan} — ngày`}
          className={`${O} w-20`}
        />
        <span className="text-stone-400">/</span>
        <input
          value={o.thang}
          onChange={(e) => doiSo('thang', e.target.value)}
          inputMode="numeric"
          placeholder="Tháng"
          aria-label={`${nhan} — tháng`}
          className={`${O} w-20`}
        />
        <span className="text-stone-400">/</span>
        <input
          value={o.nam}
          onChange={(e) => doiSo('nam', e.target.value)}
          inputMode="numeric"
          placeholder="Năm"
          aria-label={`${nhan} — năm`}
          className={`${O} w-24`}
        />
        {(o.ngay || o.thang || o.nam) && (
          <button
            type="button"
            onClick={() => {
              datO({ ngay: '', thang: '', nam: '' });
              capNhat({ duong: undefined });
            }}
            className="!min-h-0 rounded-lg px-2 py-1 text-sm text-stone-500 hover:text-red-700"
          >
            Xoá
          </button>
        )}
      </div>

      {o.nam && !loi && (
        <span className="mt-1 block text-xs text-stone-500">
          Năm {o.nam} là năm {canChiNam(Number(o.nam))}
        </span>
      )}
      {loi ? (
        <span className="mt-1 block text-xs text-amber-700 toi:text-amber-500">{loi}</span>
      ) : (
        goiY && !o.nam && <span className="mt-1 block text-xs text-stone-500">{goiY}</span>
      )}

      {/* Không nhớ năm dương lịch: tra ngược từ can chi */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => datMoCanChi((x) => !x)}
          className="!min-h-0 rounded-lg text-sm font-medium text-amber-800 underline toi:text-amber-400"
        >
          {moCanChi ? 'Đóng phần tra can chi' : 'Không nhớ năm? Tra từ can chi'}
        </button>

        {moCanChi && (
          <div className="mt-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 toi:bg-amber-950/40 toi:ring-amber-900">
            <p className="mb-2 text-xs text-amber-900 toi:text-amber-200">
              Các cụ thường nhớ can chi chứ không nhớ năm dương lịch. Chọn can chi, phần mềm lần ra
              năm giúp.
            </p>
            <div className="flex gap-2">
              <select
                value={can}
                onChange={(e) => datCan(e.target.value)}
                aria-label="Can"
                className={`${O_CHON} flex-1`}
              >
                {CAN.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <select
                value={chi}
                onChange={(e) => datChi(e.target.value)}
                aria-label="Chi"
                className={`${O_CHON} flex-1`}
              >
                {CHI.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            {khoangUoc && (
              <p className="mt-2 text-xs text-amber-900 toi:text-amber-200">
                Đang tìm trong khoảng {khoangUoc.tu}–{khoangUoc.den}, {khoangUoc.canCu}.
              </p>
            )}

            <div className="mt-2">
              {namUngVien.length === 0 ? (
                <p className="text-xs text-amber-900 toi:text-amber-200">
                  Không có năm {can} {chi} nào rơi vào khoảng này. Xem lại can chi, hoặc bổ sung năm
                  sinh cho cha mẹ trước để phần mềm khoanh vùng đúng hơn.
                </p>
              ) : (
                <>
                  <span className="mb-1 block text-xs text-amber-900 toi:text-amber-200">
                    Bấm chọn năm đúng:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {namUngVien.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => chonNam(n)}
                        className="!min-h-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-amber-400 hover:bg-amber-100 toi:bg-stone-900 toi:ring-amber-700"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Không rõ hẳn: vẫn ghi lại được những gì còn nhớ */}
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={khongRo}
          onChange={(e) => capNhat({ khongRo: e.target.checked || undefined })}
          className="!min-h-0 size-5"
        />
        Không rõ, chỉ ghi lại theo lời kể
      </label>

      {(khongRo || ghiChu) && (
        <input
          value={ghiChu}
          onChange={(e) => capNhat({ ghiChu: e.target.value || undefined })}
          placeholder="Ví dụ: khoảng đời Tự Đức, thọ 80 tuổi, mất năm đói Ất Dậu"
          aria-label={`${nhan} — ghi chú`}
          className="mt-1.5 w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
        />
      )}
    </div>
  );
}
