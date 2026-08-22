import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChiMuc, useGiaPha } from '../boiCanh/GiaPhaContext';
import Icon from '../components/Icon';
import { amCuaNgay, canChiNam, chuoiAmLich, chuoiDuongLich } from '../lib/amLich';
import { conBaoLau, gioSapToi } from '../lib/gio';
import { thongKe } from '../lib/timKiem';
import AnhNguoi from '../components/AnhNguoi';

export default function TrangChu() {
  const ci = useChiMuc();
  const { giaPha } = useGiaPha();
  const dieuHuong = useNavigate();
  const [tuKhoa, datTuKhoa] = useState('');

  const tk = thongKe(ci);
  const homNay = new Date();
  const am = amCuaNgay(homNay);
  const sapGio = gioSapToi(ci, 60).slice(0, 6);
  const thuyTo = giaPha?.dongHo.thuyToId ? ci.byId.get(giaPha.dongHo.thuyToId) : undefined;

  if (tk.tongSo === 0) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl bg-gradient-to-b from-amber-800 to-amber-900 px-5 py-8 text-center text-amber-50 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold">Gia phả còn trống</h1>
          <p className="mx-auto mt-2 max-w-md text-amber-100/90">
            Chưa có tên ai trong sổ. Hãy bắt đầu từ cụ thuỷ tổ — người xa đời nhất mà dòng họ còn
            nhớ được — rồi thêm dần con cháu từng đời.
          </p>
          <Link
            to="/cay"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-5 py-2.5 font-medium text-amber-900"
          >
            <Icon ten="cay" className="size-5" />
            Bắt đầu dựng cây gia phả
          </Link>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/quan-tri"
            className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800"
          >
            <span className="block font-medium">Nhập bằng biểu mẫu</span>
            <span className="block text-sm text-stone-500 toi:text-stone-400">
              Vào Quản trị để nhập đầy đủ ngày giỗ, mộ phần, ảnh, hoặc nhập hàng loạt từ file CSV.
            </span>
          </Link>
          <Link
            to="/quan-tri"
            className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800"
          >
            <span className="block font-medium">Xem thử với dữ liệu mẫu</span>
            <span className="block text-sm text-stone-500 toi:text-stone-400">
              Quản trị → Xuất / Nhập → “Nạp dữ liệu mẫu” để chạy thử một dòng họ 44 người, 6 đời.
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-stone-500 toi:text-stone-400">
          Hôm nay {chuoiDuongLich(homNay)} · {chuoiAmLich(am)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-b from-amber-800 to-amber-900 px-5 py-7 text-amber-50 shadow-sm">
        <h1 className="font-serif text-2xl leading-snug font-semibold">
          {giaPha?.dongHo.ten ?? 'Gia phả dòng họ'}
        </h1>
        <p className="mt-1 text-sm text-amber-100/90">
          {chuoiDuongLich(homNay)} · {chuoiAmLich(am)}
        </p>

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            dieuHuong(`/tim-kiem?q=${encodeURIComponent(tuKhoa)}`);
          }}
        >
          <div className="relative">
            <Icon
              ten="kinh-lup"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => datTuKhoa(e.target.value)}
              placeholder="Tìm người trong họ..."
              className="w-full rounded-xl bg-white py-3 pr-4 pl-11 text-stone-900 shadow-sm placeholder:text-stone-400"
            />
          </div>
        </form>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { so: tk.tongSo, nhan: 'người' },
            { so: tk.soDoi, nhan: 'đời' },
            { so: tk.soChi, nhan: 'chi/nhánh' },
          ].map((x) => (
            <div key={x.nhan} className="rounded-xl bg-amber-950/30 py-2.5">
              <div className="font-serif text-2xl font-semibold">{x.so}</div>
              <div className="text-xs text-amber-100/80">{x.nhan}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/vai-ve"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 transition hover:ring-amber-700 toi:bg-stone-900 toi:ring-stone-800"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900 toi:bg-amber-950 toi:text-amber-300">
            <Icon ten="vai-ve" className="size-6" />
          </span>
          <span>
            <span className="block font-medium">So vai vế hai người</span>
            <span className="block text-sm text-stone-500 toi:text-stone-400">
              Xem hai người trong họ gọi nhau là gì
            </span>
          </span>
        </Link>
        <Link
          to="/cay"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 transition hover:ring-amber-700 toi:bg-stone-900 toi:ring-stone-800"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-900 toi:bg-emerald-950 toi:text-emerald-300">
            <Icon ten="cay" className="size-6" />
          </span>
          <span>
            <span className="block font-medium">Cây gia phả</span>
            <span className="block text-sm text-stone-500 toi:text-stone-400">
              Xem thế thứ các đời trong họ
            </span>
          </span>
        </Link>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Ngày giỗ sắp tới</h2>
          <Link to="/gio" className="text-sm font-medium text-amber-800 toi:text-amber-400">
            Xem cả năm
          </Link>
        </div>
        {sapGio.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-5 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
            Không có ngày giỗ nào trong 60 ngày tới.
          </p>
        ) : (
          <ul className="space-y-2">
            {sapGio.map((m) => (
              <li key={m.nguoi.id}>
                <Link
                  to={`/nguoi/${m.nguoi.id}`}
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-200 transition hover:bg-amber-50 toi:bg-stone-900 toi:ring-stone-800 toi:hover:bg-stone-800"
                >
                  <AnhNguoi nguoi={m.nguoi} co="nho" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.nguoi.hoTen}</div>
                    <div className="truncate text-sm text-stone-600 toi:text-stone-400">
                      {m.gio.ngay}/{m.gio.thang} âm · {chuoiDuongLich(m.ngayDuong)}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.conNgay <= 7
                        ? 'bg-red-100 text-red-800 toi:bg-red-950 toi:text-red-300'
                        : 'bg-stone-100 text-stone-600 toi:bg-stone-800 toi:text-stone-300'
                    }`}
                  >
                    {conBaoLau(m.conNgay)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {giaPha?.dongHo.loiTua && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
          <h2 className="mb-2 text-lg font-semibold">Lời tựa</h2>
          <p className="font-serif whitespace-pre-line text-stone-700 toi:text-stone-300">
            {giaPha.dongHo.loiTua}
          </p>
          {thuyTo && (
            <p className="mt-4 border-t border-stone-200 pt-3 text-sm text-stone-600 toi:border-stone-800 toi:text-stone-400">
              Thuỷ tổ:{' '}
              <Link to={`/nguoi/${thuyTo.id}`} className="font-medium text-amber-800 toi:text-amber-400">
                {thuyTo.hoTen}
              </Link>
              {thuyTo.sinh?.duong && ` (sinh năm ${thuyTo.sinh.duong.slice(0, 4)} — ${canChiNam(Number(thuyTo.sinh.duong.slice(0, 4)))})`}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
