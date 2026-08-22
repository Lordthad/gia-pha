import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import ChonNguoi from '../components/ChonNguoi';
import Icon from '../components/Icon';
import { khoangNam } from '../lib/chiMuc';
import { soSanhVaiVe } from '../lib/xungHo';
import type { ID } from '../types/giapha';

export default function SoVaiVe() {
  const ci = useChiMuc();
  const [thamSo, datThamSo] = useSearchParams();
  const a = thamSo.get('a') ?? undefined;
  const b = thamSo.get('b') ?? undefined;

  const dat = (khoa: 'a' | 'b', gt?: ID) => {
    const moi = new URLSearchParams(thamSo);
    if (gt) moi.set(khoa, gt);
    else moi.delete(khoa);
    datThamSo(moi, { replace: true });
  };

  const doiCho = () => {
    const moi = new URLSearchParams();
    if (b) moi.set('a', b);
    if (a) moi.set('b', a);
    datThamSo(moi, { replace: true });
  };

  const kq = useMemo(
    () => (a && b && ci.byId.has(a) && ci.byId.has(b) ? soSanhVaiVe(ci, a, b) : undefined),
    [ci, a, b],
  );

  const nA = a ? ci.byId.get(a) : undefined;
  const nB = b ? ci.byId.get(b) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">So vai vế</h1>
        <p className="text-sm text-stone-600 toi:text-stone-400">
          Chọn hai người trong họ để xem họ gọi nhau là gì, kèm đường quan hệ để đối chiếu.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <ChonNguoi
          nhan="Người thứ nhất"
          giaTri={a}
          onChon={(id) => dat('a', id)}
          loaiTru={b ? [b] : []}
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={doiCho}
            disabled={!a && !b}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40 toi:text-amber-400 toi:hover:bg-stone-800"
          >
            <Icon ten="doi-cho" className="size-4" />
            Đổi chỗ
          </button>
        </div>
        <ChonNguoi
          nhan="Người thứ hai"
          giaTri={b}
          onChon={(id) => dat('b', id)}
          loaiTru={a ? [a] : []}
        />
      </div>

      {!kq && (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
          Hãy chọn đủ hai người ở trên.
        </p>
      )}

      {kq && nA && nB && (
        <>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
            <div className="bg-amber-800 px-4 py-2.5 text-sm font-medium text-amber-50">
              {kq.vaiVe}
              {kq.doiA != null && kq.doiB != null && (
                <span className="ml-2 text-amber-200/90">
                  (đời {kq.doiA} và đời {kq.doiB})
                </span>
              )}
            </div>

            <div className="grid divide-y divide-stone-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 toi:divide-stone-800">
              <div className="p-4">
                <div className="text-sm text-stone-500 toi:text-stone-400">
                  <Link to={`/nguoi/${nA.id}`} className="font-medium text-amber-800 toi:text-amber-400">
                    {nA.hoTen}
                  </Link>{' '}
                  gọi {nB.hoTen} là
                </div>
                <div className="mt-1 font-serif text-3xl font-semibold text-amber-900 toi:text-amber-300">
                  {kq.AgoiB}
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-stone-500 toi:text-stone-400">
                  <Link to={`/nguoi/${nB.id}`} className="font-medium text-amber-800 toi:text-amber-400">
                    {nB.hoTen}
                  </Link>{' '}
                  gọi {nA.hoTen} là
                </div>
                <div className="mt-1 font-serif text-3xl font-semibold text-amber-900 toi:text-amber-300">
                  {kq.BgoiA}
                </div>
              </div>
            </div>

            <p className="border-t border-stone-200 px-4 py-3 text-stone-700 toi:border-stone-800 toi:text-stone-300">
              {kq.giaiThich}
            </p>
          </div>

          {kq.canhBao.length > 0 && (
            <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300 toi:bg-amber-950/40 toi:ring-amber-800">
              <div className="mb-1 flex items-center gap-2 font-medium text-amber-900 toi:text-amber-200">
                <Icon ten="canh-bao" className="size-5" />
                Cần lưu ý
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-900 toi:text-amber-200">
                {kq.canhBao.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {kq.duongDi.length > 1 && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
              <h2 className="mb-3 font-semibold">Đường quan hệ</h2>
              <ol className="space-y-0">
                {kq.duongDi.map((buoc, i) => {
                  const p = ci.byId.get(buoc.id);
                  const laToChung = kq.toChung?.id === buoc.id;
                  return (
                    <li key={`${buoc.id}-${i}`} className="relative pl-7">
                      {i < kq.duongDi.length - 1 && (
                        <span className="absolute top-6 left-[9px] h-full w-px bg-stone-300 toi:bg-stone-700" />
                      )}
                      <span
                        className={`absolute top-3 left-1 size-[10px] rounded-full ring-2 ring-white toi:ring-stone-900 ${
                          laToChung ? 'bg-amber-700' : 'bg-stone-400 toi:bg-stone-600'
                        }`}
                      />
                      <div className="py-1.5">
                        {buoc.quanHe && (
                          <div className="text-xs text-stone-500 toi:text-stone-400">
                            {buoc.quanHe}
                          </div>
                        )}
                        <Link
                          to={`/nguoi/${buoc.id}`}
                          className="font-medium text-stone-800 hover:text-amber-800 toi:text-stone-100 toi:hover:text-amber-400"
                        >
                          {buoc.hoTen}
                        </Link>
                        {p && khoangNam(p) && (
                          <span className="ml-2 text-sm text-stone-500 toi:text-stone-400">
                            {khoangNam(p)}
                          </span>
                        )}
                        {laToChung && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 toi:bg-amber-950 toi:text-amber-300">
                            tổ chung
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <p className="text-center text-sm text-stone-500 toi:text-stone-400">
            Gửi kết quả này cho người khác bằng cách sao chép đường dẫn trên thanh địa chỉ.
          </p>
        </>
      )}
    </div>
  );
}
