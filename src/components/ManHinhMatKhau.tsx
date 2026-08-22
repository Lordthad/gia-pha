import { useState } from 'react';
import { useGiaPha } from '../boiCanh/GiaPhaContext';
import Logo from './Logo';

/** Màn hình hỏi mật khẩu xem khi file dữ liệu được mã hoá. */
export default function ManHinhMatKhau() {
  const { moKhoa } = useGiaPha();
  const [matKhau, datMatKhau] = useState('');
  const [nhoMay, datNhoMay] = useState(false);
  const [dangMo, datDangMo] = useState(false);
  const [loi, datLoi] = useState<string>();

  const gui = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matKhau) return;
    datDangMo(true);
    datLoi(undefined);
    const xong = await moKhoa(matKhau, nhoMay);
    if (!xong) {
      datLoi('Mật khẩu không đúng. Hỏi lại người giữ gia phả trong họ.');
      datMatKhau('');
    }
    datDangMo(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="size-14" />
          <h1 className="mt-3 font-serif text-xl font-semibold">Gia phả dòng họ</h1>
          <p className="mt-1 text-sm text-stone-600 toi:text-stone-400">
            Gia phả này của riêng người trong họ. Nhập mật khẩu để xem.
          </p>
        </div>

        <form
          onSubmit={gui}
          className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
              Mật khẩu
            </span>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              type="password"
              value={matKhau}
              onChange={(e) => datMatKhau(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-stone-600 toi:text-stone-400">
            <input
              type="checkbox"
              checked={nhoMay}
              onChange={(e) => datNhoMay(e.target.checked)}
              className="!min-h-0 size-5"
            />
            Nhớ trên máy này
          </label>

          {loi && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 toi:bg-red-950 toi:text-red-300">
              {loi}
            </p>
          )}

          <button
            type="submit"
            disabled={dangMo || !matKhau}
            className="w-full rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {dangMo ? 'Đang mở...' : 'Xem gia phả'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-500">
          Việc mở khoá diễn ra ngay trên máy bạn. Mật khẩu không được gửi đi đâu cả.
        </p>
      </div>
    </div>
  );
}
