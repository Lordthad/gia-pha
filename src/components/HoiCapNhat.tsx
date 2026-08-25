import { useEffect, useState } from 'react';
import { useGiaPha } from '../boiCanh/GiaPhaContext';
import Icon from './Icon';

/**
 * Hỏi thẳng "có lấy bản mới về không", thay vì để một dòng chữ đỏ trên đầu màn
 * hình rồi mong người ta tự hiểu. Các bác lớn tuổi chỉ phải chọn Có hoặc Không.
 *
 * Chỉ hiện khi máy này đang giữ phần sửa dở — máy chỉ để xem thì đã tự lấy bản
 * mới từ lúc mở website, không phiền ai cả.
 */
export default function HoiCapNhat({ onDong }: { onDong: () => void }) {
  const { capNhatTrenMang, boBanNhap } = useGiaPha();
  const [dangLay, datDangLay] = useState(false);

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong();
    };
    document.addEventListener('keydown', phim);
    return () => document.removeEventListener('keydown', phim);
  }, [onDong]);

  const luc = capNhatTrenMang
    ? new Date(capNhatTrenMang).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : undefined;

  return (
    <div className="khong-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoi-cap-nhat-tieu-de"
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl toi:bg-stone-900"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800 toi:bg-amber-900/40 toi:text-amber-300">
            <Icon ten="tai-ve" className="size-6" />
          </span>
          <h2 id="hoi-cap-nhat-tieu-de" className="font-serif text-xl font-semibold">
            Gia phả có bản mới
          </h2>
        </div>

        <p className="text-lg leading-relaxed text-stone-700 toi:text-stone-300">
          Người trong họ vừa cập nhật gia phả{luc ? ` lúc ${luc}` : ''}. Lấy bản mới về máy này
          để xem cho đúng nhé?
        </p>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-base leading-relaxed text-amber-900 toi:bg-amber-950/50 toi:text-amber-200">
          Máy này đang có phần vừa sửa mà chưa đưa lên mạng. Lấy bản mới thì phần đó bỏ đi,
          phải nhập lại.
        </p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            disabled={dangLay}
            onClick={() => {
              datDangLay(true);
              boBanNhap().finally(onDong);
            }}
            className="w-full rounded-xl bg-amber-800 px-4 py-4 text-lg font-semibold text-white disabled:opacity-60"
          >
            {dangLay ? 'Đang lấy...' : 'Có, lấy bản mới'}
          </button>
          <button
            type="button"
            disabled={dangLay}
            onClick={onDong}
            className="w-full rounded-xl bg-stone-100 px-4 py-4 text-lg font-semibold text-stone-700 toi:bg-stone-800 toi:text-stone-300"
          >
            Không, giữ nguyên
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          Chọn Không thì lúc nào muốn lấy, bấm dòng chữ đỏ trên đầu màn hình.
        </p>
      </div>
    </div>
  );
}
