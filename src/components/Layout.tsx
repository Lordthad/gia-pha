import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useGiaPha } from '../boiCanh/GiaPhaContext';
import HoiCapNhat from './HoiCapNhat';
import Icon, { type TenIcon } from './Icon';
import Logo from './Logo';

const MUC: Array<{ den: string; nhan: string; icon: TenIcon }> = [
  { den: '/', nhan: 'Trang chủ', icon: 'nha' },
  { den: '/tim-kiem', nhan: 'Tra cứu', icon: 'kinh-lup' },
  { den: '/cay', nhan: 'Cây họ', icon: 'cay' },
  { den: '/vai-ve', nhan: 'Vai vế', icon: 'vai-ve' },
  { den: '/gio', nhan: 'Ngày giỗ', icon: 'nhang' },
];

function useCheDoToi(): [boolean, () => void] {
  const [toi, datToi] = useState(() => {
    const luu = localStorage.getItem('gia-pha:giao-dien');
    if (luu) return luu === 'toi';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('toi', toi);
    localStorage.setItem('gia-pha:giao-dien', toi ? 'toi' : 'sang');
  }, [toi]);
  return [toi, () => datToi((x) => !x)];
}

export default function Layout({ children }: { children: ReactNode }) {
  const { giaPha, tuBanNhap, banTrenMangMoiHon, capNhatTrenMang } = useGiaPha();
  const [toi, doiGiaoDien] = useCheDoToi();
  const viTri = useLocation();
  // Hỏi ngay khi mở website chứ không đợi người ta để ý dòng chữ đỏ.
  const [hoiCapNhat, datHoiCapNhat] = useState(false);

  useEffect(() => {
    if (banTrenMangMoiHon) datHoiCapNhat(true);
  }, [banTrenMangMoiHon]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [viTri.pathname]);

  const lopMuc = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-amber-800 text-white'
        : 'text-stone-700 hover:bg-amber-100 toi:text-stone-300 toi:hover:bg-stone-800'
    }`;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="khong-in sticky top-0 z-30 border-b border-stone-200 bg-stone-100/95 backdrop-blur toi:border-stone-800 toi:bg-stone-950/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <Logo className="size-9 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-serif text-base leading-tight font-semibold">
                {giaPha?.dongHo.ten ?? 'Gia phả dòng họ'}
              </span>
              <span className="block text-xs text-stone-500 toi:text-stone-400">Gia phả điện tử</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {MUC.map((m) => (
              <NavLink key={m.den} to={m.den} end={m.den === '/'} className={lopMuc}>
                <Icon ten={m.icon} className="size-4" />
                {m.nhan}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button
              type="button"
              onClick={doiGiaoDien}
              title={toi ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              className="grid size-11 place-items-center rounded-xl text-stone-600 hover:bg-amber-100 toi:text-stone-300 toi:hover:bg-stone-800"
            >
              <Icon ten={toi ? 'trang' : 'toi'} />
            </button>
            <NavLink
              to="/quan-tri"
              title="Quản trị dữ liệu"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium md:px-3 ${
                  isActive
                    ? 'bg-amber-800 text-white'
                    : 'text-stone-600 hover:bg-amber-100 toi:text-stone-300 toi:hover:bg-stone-800'
                }`
              }
            >
              <Icon ten="banh-rang" />
              <span>Quản trị</span>
            </NavLink>
          </div>
        </div>

        {banTrenMangMoiHon ? (
          <div className="bg-red-100 px-4 py-1.5 text-center text-sm text-red-900 toi:bg-red-950 toi:text-red-200">
            Trên mạng đã có bản mới hơn
            {capNhatTrenMang
              ? ` (cập nhật ${new Date(capNhatTrenMang).toLocaleString('vi-VN')})`
              : ''}
            . Máy này đang xem bản nháp cũ.{' '}
            {/*
              Nút này cố tình không hỏi mã quản trị: chỉ xem thôi thì ai trong họ
              cũng phải lấy được bản mới nhất, kể cả trên điện thoại không giữ mã.
            */}
            <button
              type="button"
              onClick={() => datHoiCapNhat(true)}
              className="font-semibold underline"
            >
              Lấy bản mới về máy này
            </button>
          </div>
        ) : (
          tuBanNhap && (
            <div className="bg-amber-100 px-4 py-1.5 text-center text-sm text-amber-900 toi:bg-amber-950 toi:text-amber-200">
              Đang dùng bản nháp chưa đưa lên mạng.{' '}
              <Link to="/quan-tri" className="font-semibold underline">
                Vào Quản trị để đưa lên
              </Link>
            </div>
          )
        )}
      </header>

      {hoiCapNhat && banTrenMangMoiHon && <HoiCapNhat onDong={() => datHoiCapNhat(false)} />}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:pb-10">{children}</main>

      <nav className="khong-in fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden toi:border-stone-800 toi:bg-stone-900/95">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MUC.map((m) => (
            <NavLink
              key={m.den}
              to={m.den}
              end={m.den === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-amber-800 toi:text-amber-400' : 'text-stone-500 toi:text-stone-400'
                }`
              }
            >
              <Icon ten={m.icon} className="size-6" />
              {m.nhan}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
