import { useEffect, useState } from 'react';
import { layAnh } from '../lib/luuTru';
import type { Person } from '../types/giapha';

/**
 * Giải đường dẫn ảnh: ưu tiên ảnh đang giữ trong máy (chế độ Quản trị chưa xuất),
 * không có thì lấy file trong thư mục media của website.
 */
export function useDuongDanAnh(duongDan?: string): string | undefined {
  const [url, datUrl] = useState<string>();
  useEffect(() => {
    let huy = false;
    if (!duongDan) {
      datUrl(undefined);
      return;
    }
    layAnh(duongDan).then((trongMay) => {
      if (huy) return;
      datUrl(trongMay ?? `${import.meta.env.BASE_URL}${duongDan.replace(/^\//, '')}`);
    });
    return () => {
      huy = true;
    };
  }, [duongDan]);
  return url;
}

const MAU_NEN: Record<string, string> = {
  nam: 'bg-sky-100 text-sky-800 toi:bg-sky-950 toi:text-sky-200',
  nu: 'bg-rose-100 text-rose-800 toi:bg-rose-950 toi:text-rose-200',
  khac: 'bg-stone-200 text-stone-700 toi:bg-stone-800 toi:text-stone-200',
};

/** Chữ cái đầu của tên, dùng khi chưa có ảnh. */
function chuDau(hoTen: string): string {
  const phan = hoTen.trim().split(/\s+/);
  return (phan[phan.length - 1]?.[0] ?? '?').toUpperCase();
}

interface Props {
  nguoi: Person;
  co?: 'nho' | 'vua' | 'lon';
  className?: string;
}

export default function AnhNguoi({ nguoi, co = 'vua', className = '' }: Props) {
  const url = useDuongDanAnh(nguoi.anhDaiDien);
  const [hong, datHong] = useState(false);
  const kichThuoc =
    co === 'nho' ? 'size-11 text-lg' : co === 'lon' ? 'size-32 text-5xl' : 'size-16 text-2xl';

  if (url && !hong) {
    return (
      <img
        src={url}
        alt={`Ảnh ${nguoi.hoTen}`}
        onError={() => datHong(true)}
        className={`${kichThuoc} shrink-0 rounded-full object-cover ring-1 ring-stone-300 toi:ring-stone-700 ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${kichThuoc} ${MAU_NEN[nguoi.gioiTinh] ?? MAU_NEN.khac} ${className} flex shrink-0 items-center justify-center rounded-full font-serif font-semibold`}
    >
      {chuDau(nguoi.hoTen)}
    </div>
  );
}
