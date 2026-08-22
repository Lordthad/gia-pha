import { useEffect, useState } from 'react';
import type { GioiTinh, ID, Person } from '../types/giapha';
import Icon from './Icon';

export interface DuLieuNhanh {
  hoTen: string;
  gioiTinh: GioiTinh;
  namSinh?: number;
  thuTu?: number;
  /** Người còn lại trong cặp cha mẹ, khi cha/mẹ có nhiều vợ hoặc chồng. */
  chaMeKia?: ID;
  /** Thứ tự dòng vợ khi thêm vợ/chồng: 1 = vợ cả. */
  thuTuVo?: number;
}

interface Props {
  tieuDe: string;
  moTa?: string;
  banDau?: Partial<DuLieuNhanh>;
  /** Danh sách để chọn người cha/mẹ còn lại; chỉ hiện khi có từ 2 người trở lên. */
  chonChaMeKia?: Person[];
  nhanChaMeKia?: string;
  /** Số thứ tự dòng vợ gợi ý; khác undefined thì hiện ô chọn vợ cả/vợ hai. */
  hoiThuTuVo?: number;
  nhanThuTu?: string;
  onLuu: (d: DuLieuNhanh) => void;
  onDong: () => void;
  onFormDayDu?: () => void;
}

const O =
  'w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700';

const TEN_THU_TU = ['cả', 'hai', 'ba', 'tư', 'năm', 'sáu'];

/** Năm sinh phải ra hình một cái năm, tránh gõ nhầm 1 hoặc 19 rồi bỏ dở. */
function loiNamSinh(nam?: number): string | undefined {
  if (nam == null) return undefined;
  if (nam < 1000) return 'Năm phải đủ 4 chữ số, ví dụ 1954.';
  if (nam > new Date().getFullYear() + 1) return 'Năm này ở tương lai, xem lại giúp.';
  return undefined;
}

/** Hộp thoại nhập nhanh dùng khi dựng cây trực tiếp trên sơ đồ. */
export default function ThemNhanh({
  tieuDe,
  moTa,
  banDau,
  chonChaMeKia,
  nhanChaMeKia = 'Người còn lại',
  hoiThuTuVo,
  nhanThuTu = 'Thứ tự sinh trong các con',
  onLuu,
  onDong,
  onFormDayDu,
}: Props) {
  const [d, datD] = useState<DuLieuNhanh>({
    hoTen: banDau?.hoTen ?? '',
    gioiTinh: banDau?.gioiTinh ?? 'nam',
    namSinh: banDau?.namSinh,
    thuTu: banDau?.thuTu,
    chaMeKia: banDau?.chaMeKia ?? chonChaMeKia?.[0]?.id,
    thuTuVo: banDau?.thuTuVo ?? hoiThuTuVo,
  });

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong();
    };
    document.addEventListener('keydown', phim);
    return () => document.removeEventListener('keydown', phim);
  }, [onDong]);

  const dat = <K extends keyof DuLieuNhanh>(k: K, v: DuLieuNhanh[K]) =>
    datD((x) => ({ ...x, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDong();
      }}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl toi:bg-stone-900">
        <div className="mb-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-lg font-semibold">{tieuDe}</h2>
            {moTa && <p className="text-sm text-stone-600 toi:text-stone-400">{moTa}</p>}
          </div>
          <button
            type="button"
            onClick={onDong}
            aria-label="Đóng"
            className="grid !min-h-0 size-9 shrink-0 place-items-center rounded-lg text-stone-500"
          >
            <Icon ten="dong" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.hoTen.trim()) return;
            onLuu({ ...d, hoTen: d.hoTen.trim() });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Họ và tên *
            </span>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              required
              value={d.hoTen}
              onChange={(e) => dat('hoTen', e.target.value)}
              className={O}
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Giới tính
            </span>
            <div className="flex gap-2">
              {(
                [
                  ['nam', 'Nam'],
                  ['nu', 'Nữ'],
                ] as Array<[GioiTinh, string]>
              ).map(([gt, nhan]) => (
                <button
                  key={gt}
                  type="button"
                  onClick={() => dat('gioiTinh', gt)}
                  className={`flex-1 rounded-xl px-3 py-2.5 font-medium ring-1 ${
                    d.gioiTinh === gt
                      ? 'bg-amber-800 text-white ring-amber-800'
                      : 'bg-white text-stone-700 ring-stone-300 toi:bg-stone-950 toi:text-stone-300 toi:ring-stone-700'
                  }`}
                >
                  {nhan}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                Năm sinh
              </span>
              <input
                inputMode="numeric"
                value={d.namSinh ?? ''}
                onChange={(e) => {
                  const so = e.target.value.replace(/\D/g, '').slice(0, 4);
                  dat('namSinh', so ? Number(so) : undefined);
                }}
                placeholder="1950"
                className={O}
              />
              {loiNamSinh(d.namSinh) && (
                <span className="mt-1 block text-xs text-amber-700 toi:text-amber-500">
                  {loiNamSinh(d.namSinh)}
                </span>
              )}
            </label>
            {hoiThuTuVo == null && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  {nhanThuTu}
                </span>
                <input
                  inputMode="numeric"
                  value={d.thuTu ?? ''}
                  onChange={(e) => {
                    const so = e.target.value.replace(/\D/g, '').slice(0, 2);
                    dat('thuTu', so ? Number(so) : undefined);
                  }}
                  className={O}
                />
              </label>
            )}
            {hoiThuTuVo != null && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                  Thứ tự
                </span>
                <select
                  value={d.thuTuVo ?? hoiThuTuVo}
                  onChange={(e) => dat('thuTuVo', Number(e.target.value))}
                  className={O}
                >
                  {Array.from({ length: Math.max(hoiThuTuVo, 2) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {d.gioiTinh === 'nu' ? 'Vợ' : 'Chồng'} {TEN_THU_TU[n - 1] ?? n}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {chonChaMeKia && chonChaMeKia.length > 1 && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
                {nhanChaMeKia}
              </span>
              <select
                value={d.chaMeKia ?? ''}
                onChange={(e) => dat('chaMeKia', e.target.value || undefined)}
                className={O}
              >
                {chonChaMeKia.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.hoTen}
                  </option>
                ))}
                <option value="">— Chưa rõ —</option>
              </select>
            </label>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white"
            >
              Lưu
            </button>
            {onFormDayDu && (
              <button
                type="button"
                onClick={onFormDayDu}
                className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
              >
                Form đầy đủ
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
