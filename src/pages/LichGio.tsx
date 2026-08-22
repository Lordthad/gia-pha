import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import AnhNguoi from '../components/AnhNguoi';
import Icon from '../components/Icon';
import { amCuaNgay, canChiNam, chuoiDuongLich } from '../lib/amLich';
import { conBaoLau, gioSapToi, gioTheoThang, type MucGio } from '../lib/gio';

function DongGio({ m, hienThang }: { m: MucGio; hienThang?: boolean }) {
  return (
    <Link
      to={`/nguoi/${m.nguoi.id}`}
      className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-200 transition hover:bg-amber-50 toi:bg-stone-900 toi:ring-stone-800 toi:hover:bg-stone-800"
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-800 toi:bg-red-950 toi:text-red-300">
        <div className="text-center leading-none">
          <div className="text-lg font-semibold">{m.gio.ngay}</div>
          {hienThang && <div className="text-[10px]">th {m.gio.thang}</div>}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <AnhNguoi nguoi={m.nguoi} co="nho" className="!size-8 !text-sm" />
          <span className="truncate font-medium">{m.nguoi.hoTen}</span>
        </div>
        <div className="truncate text-sm text-stone-600 toi:text-stone-400">
          {chuoiDuongLich(m.ngayDuong)}
          {m.gio.suyRa && ' · quy đổi từ ngày mất'}
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
  );
}

export default function LichGio() {
  const ci = useChiMuc();
  const [xem, datXem] = useState<'sap-toi' | 'ca-nam'>('sap-toi');
  const homNay = new Date();
  const am = amCuaNgay(homNay);

  const sapToi = useMemo(() => gioSapToi(ci, 120), [ci]);
  const theoThang = useMemo(() => gioTheoThang(ci), [ci]);
  const tongSo = useMemo(
    () => [...theoThang.values()].reduce((s, x) => s + x.length, 0),
    [theoThang],
  );

  const lopNut = (dang: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
      dang
        ? 'bg-white text-amber-900 shadow-sm toi:bg-stone-700 toi:text-amber-300'
        : 'text-stone-600 toi:text-stone-400'
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Lịch giỗ trong họ</h1>
        <p className="text-sm text-stone-600 toi:text-stone-400">
          Hôm nay {chuoiDuongLich(homNay)} — ngày {am.ngay} tháng {am.thang}
          {am.nhuan ? ' nhuận' : ''} năm {canChiNam(am.nam)}. Ghi nhận {tongSo} ngày giỗ.
        </p>
      </div>

      <div className="flex rounded-xl bg-stone-100 p-1 toi:bg-stone-800">
        <button type="button" onClick={() => datXem('sap-toi')} className={lopNut(xem === 'sap-toi')}>
          Sắp tới (120 ngày)
        </button>
        <button type="button" onClick={() => datXem('ca-nam')} className={lopNut(xem === 'ca-nam')}>
          Cả năm theo tháng âm
        </button>
      </div>

      {xem === 'sap-toi' &&
        (sapToi.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-6 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
            Không có ngày giỗ nào trong 120 ngày tới.
          </p>
        ) : (
          <ul className="space-y-2">
            {sapToi.map((m) => (
              <li key={m.nguoi.id}>
                <DongGio m={m} hienThang />
              </li>
            ))}
          </ul>
        ))}

      {xem === 'ca-nam' && (
        <div className="space-y-5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((thang) => {
            const ds = theoThang.get(thang);
            if (!ds || ds.length === 0) return null;
            return (
              <section key={thang}>
                <h2 className="mb-2 flex items-center gap-2 font-semibold">
                  <Icon ten="nhang" className="size-5 text-red-700 toi:text-red-400" />
                  Tháng {thang} âm lịch
                  <span className="text-sm font-normal text-stone-500 toi:text-stone-400">
                    ({ds.length} giỗ)
                  </span>
                </h2>
                <ul className="space-y-2">
                  {ds.map((m) => (
                    <li key={m.nguoi.id}>
                      <DongGio m={m} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {tongSo === 0 && (
            <p className="rounded-xl bg-white px-4 py-6 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
              Chưa có ai được ghi ngày giỗ. Vào mục Quản trị để bổ sung ngày giỗ âm lịch hoặc ngày
              mất.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
