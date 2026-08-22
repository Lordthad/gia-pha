import { useEffect, useMemo, useRef, useState } from 'react';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import { khoangNam } from '../lib/chiMuc';
import { timNguoi } from '../lib/timKiem';
import type { ID } from '../types/giapha';
import AnhNguoi from './AnhNguoi';
import Icon from './Icon';

interface Props {
  nhan: string;
  giaTri?: ID;
  onChon: (id: ID | undefined) => void;
  /** Không cho chọn những người này (ví dụ chính mình). */
  loaiTru?: ID[];
}

/** Ô chọn người có gợi ý theo tên, gõ không dấu vẫn tìm được. */
export default function ChonNguoi({ nhan, giaTri, onChon, loaiTru = [] }: Props) {
  const ci = useChiMuc();
  const [tuKhoa, datTuKhoa] = useState('');
  const [mo, datMo] = useState(false);
  const [chiSo, datChiSo] = useState(0);
  const boc = useRef<HTMLDivElement>(null);

  const daChon = giaTri ? ci.byId.get(giaTri) : undefined;

  const goiY = useMemo(() => {
    if (!mo) return [];
    return timNguoi(ci, { tuKhoa: tuKhoa.trim() || undefined })
      .filter((p) => !loaiTru.includes(p.id))
      .slice(0, 30);
  }, [ci, tuKhoa, mo, loaiTru]);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) datMo(false);
    };
    document.addEventListener('mousedown', ngoai);
    return () => document.removeEventListener('mousedown', ngoai);
  }, [mo]);

  const chon = (id: ID) => {
    onChon(id);
    datMo(false);
    datTuKhoa('');
  };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      datChiSo((i) => Math.min(i + 1, goiY.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      datChiSo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && goiY[chiSo]) {
      e.preventDefault();
      chon(goiY[chiSo].id);
    } else if (e.key === 'Escape') {
      datMo(false);
    }
  };

  return (
    <div ref={boc} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-stone-600 toi:text-stone-400">
        {nhan}
      </label>

      {daChon && !mo ? (
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700">
          <AnhNguoi nguoi={daChon} co="nho" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{daChon.hoTen}</div>
            <div className="truncate text-sm text-stone-500 toi:text-stone-400">
              Đời {ci.doi.get(daChon.id)}
              {khoangNam(daChon) && ` · ${khoangNam(daChon)}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              datMo(true);
              setTimeout(() => boc.current?.querySelector('input')?.focus(), 0);
            }}
            className="shrink-0 rounded-lg px-3 text-sm font-medium text-amber-800 hover:bg-amber-50 toi:text-amber-400 toi:hover:bg-stone-800"
          >
            Đổi
          </button>
        </div>
      ) : (
        <div className="relative">
          <Icon
            ten="kinh-lup"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            value={tuKhoa}
            placeholder="Gõ tên để tìm..."
            onChange={(e) => {
              datTuKhoa(e.target.value);
              datChiSo(0);
              datMo(true);
            }}
            onFocus={() => datMo(true)}
            onKeyDown={phim}
            className="w-full rounded-xl bg-white py-2.5 pr-3 pl-10 ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700"
          />
        </div>
      )}

      {mo && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-300 toi:bg-stone-900 toi:ring-stone-700">
          {goiY.length === 0 && (
            <li className="px-4 py-3 text-stone-500">Không tìm thấy ai phù hợp.</li>
          )}
          {goiY.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseEnter={() => datChiSo(i)}
                onClick={() => chon(p.id)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                  i === chiSo ? 'bg-amber-50 toi:bg-stone-800' : ''
                }`}
              >
                <AnhNguoi nguoi={p} co="nho" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.hoTen}</span>
                  <span className="block truncate text-sm text-stone-500 toi:text-stone-400">
                    Đời {ci.doi.get(p.id)}
                    {khoangNam(p) && ` · ${khoangNam(p)}`}
                    {p.chiNhanh && ` · ${p.chiNhanh}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
