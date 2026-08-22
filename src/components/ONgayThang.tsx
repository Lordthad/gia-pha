import { useState } from 'react';
import type { NgayThang } from '../types/giapha';

/**
 * Ô nhập ngày theo thứ tự quen thuộc: ngày / tháng / năm.
 * Chỉ nhận chữ số nên không gõ nhầm chữ vào được, mà vẫn cho phép ghi thiếu —
 * gia phả cũ thường chỉ còn nhớ mỗi năm, hoặc năm và tháng.
 */

function tach(duong?: string): { ngay: string; thang: string; nam: string } {
  if (!duong) return { ngay: '', thang: '', nam: '' };
  const [y = '', m = '', d = ''] = duong.split('-');
  return { ngay: d, thang: m, nam: y };
}

/** Ghép lại thành chuỗi lưu trữ: 1943-05-12, 1943-05, hoặc 1943. */
function ghep(ngay: string, thang: string, nam: string): string | undefined {
  if (!nam) return undefined;
  const y = nam.padStart(4, '0');
  if (!thang) return y;
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
  if ((ngay || thang) && !nam) return 'Cần ghi năm thì ngày tháng mới lưu được.';
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

interface Props {
  nhan: string;
  giaTri?: NgayThang;
  onDoi: (nt?: NgayThang) => void;
  goiY?: string;
}

export default function ONgayThang({ nhan, giaTri, onDoi, goiY }: Props) {
  const [o, datO] = useState(() => tach(giaTri?.duong));

  const doi = (phan: 'ngay' | 'thang' | 'nam', chu: string) => {
    const so = chu.replace(/\D/g, '').slice(0, phan === 'nam' ? 4 : 2);
    const moi = { ...o, [phan]: so };
    datO(moi);
    const duong = ghep(moi.ngay, moi.thang, moi.nam);
    onDoi(duong ? { ...giaTri, duong } : undefined);
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
          onChange={(e) => doi('ngay', e.target.value)}
          inputMode="numeric"
          placeholder="Ngày"
          aria-label={`${nhan} — ngày`}
          className={`${O} w-20`}
        />
        <span className="text-stone-400">/</span>
        <input
          value={o.thang}
          onChange={(e) => doi('thang', e.target.value)}
          inputMode="numeric"
          placeholder="Tháng"
          aria-label={`${nhan} — tháng`}
          className={`${O} w-20`}
        />
        <span className="text-stone-400">/</span>
        <input
          value={o.nam}
          onChange={(e) => doi('nam', e.target.value)}
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
              onDoi(undefined);
            }}
            className="!min-h-0 rounded-lg px-2 py-1 text-sm text-stone-500 hover:text-red-700"
          >
            Xoá
          </button>
        )}
      </div>
      {loi ? (
        <span className="mt-1 block text-xs text-amber-700 toi:text-amber-500">{loi}</span>
      ) : (
        goiY && <span className="mt-1 block text-xs text-stone-500">{goiY}</span>
      )}
    </div>
  );
}
