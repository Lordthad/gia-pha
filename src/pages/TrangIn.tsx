import { useMemo, useRef, useState } from 'react';
import { useChiMuc, useGiaPha } from '../boiCanh/GiaPhaContext';
import CayGiaPha from '../components/CayGiaPha';
import Icon from '../components/Icon';
import { canChiNam } from '../lib/amLich';
import { conCuaNguoi, khoangNam, voChongCua } from '../lib/chiMuc';
import { ngayGioCua } from '../lib/gio';
import { cacDoi } from '../lib/timKiem';
import { taiSvg, tenFileSoDo } from '../lib/xuatSoDo';

export default function TrangIn() {
  const ci = useChiMuc();
  const { giaPha } = useGiaPha();
  const [keTieuSu, datKeTieuSu] = useState(true);
  const [inSoDo, datInSoDo] = useState<'khong' | 'rut-gon' | 'day-du' | 'ca-hai'>('rut-gon');
  const khungDayDu = useRef<HTMLDivElement>(null);
  const khungRutGon = useRef<HTMLDivElement>(null);

  const gocId = giaPha?.dongHo.thuyToId ?? ci.giaPha.nguoi[0]?.id;
  const coSoDo = Boolean(gocId);
  const hienDayDu = inSoDo === 'day-du' || inSoDo === 'ca-hai';
  const hienRutGon = inSoDo === 'rut-gon' || inSoDo === 'ca-hai';

  const taiVeSvg = (khung: React.RefObject<HTMLDivElement | null>, rutGon: boolean) => {
    const svg = khung.current?.querySelector('svg');
    if (!svg) return;
    taiSvg(svg as SVGSVGElement, tenFileSoDo(giaPha?.dongHo.ten ?? 'gia-pha', rutGon));
  };
  const ds = cacDoi(ci);
  const homNay = new Date();

  const theoDoi = useMemo(
    () =>
      ds.map((d) => ({
        doi: d,
        nguoi: (ci.theoDoi.get(d) ?? [])
          .map((id) => ci.byId.get(id)!)
          .sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi')),
      })),
    [ci, ds],
  );

  return (
    <div className="space-y-6">
      <div className="khong-in space-y-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
        <h1 className="text-xl font-semibold">Bản in gia phả</h1>
        <p className="text-sm text-stone-600 toi:text-stone-400">
          Bấm “In” rồi chọn máy in, hoặc chọn “Lưu thành PDF” trong hộp thoại in để có file mang đi
          đóng thành sách.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={keTieuSu}
            onChange={(e) => datKeTieuSu(e.target.checked)}
            className="!min-h-0 size-5"
          />
          Kèm tiểu sử, công đức và phần mộ
        </label>

        {coSoDo && (
          <div className="space-y-2 border-t border-stone-200 pt-3 toi:border-stone-800">
            <span className="block text-sm font-medium text-stone-600 toi:text-stone-400">
              Sơ đồ cây kèm theo bản in
            </span>
            <div className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1 toi:bg-stone-800">
              {(
                [
                  ['rut-gon', 'Rút gọn'],
                  ['day-du', 'Đầy đủ'],
                  ['ca-hai', 'Cả hai'],
                  ['khong', 'Không kèm'],
                ] as const
              ).map(([gt, nhan]) => (
                <button
                  key={gt}
                  type="button"
                  onClick={() => datInSoDo(gt)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    inSoDo === gt
                      ? 'bg-white text-amber-900 shadow-sm toi:bg-stone-700 toi:text-amber-300'
                      : 'text-stone-600 toi:text-stone-400'
                  }`}
                >
                  {nhan}
                </button>
              ))}
            </div>
            <p className="text-sm text-stone-600 toi:text-stone-400">
              <strong>Rút gọn</strong> chỉ có dòng nam nối dõi nên vừa khổ giấy, hợp để treo hoặc
              đóng vào đầu quyển. <strong>Đầy đủ</strong> có cả nữ và vợ chồng nên rộng hơn nhiều —
              in nên chọn khổ ngang.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => taiVeSvg(khungRutGon, true)}
                className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium toi:bg-stone-800"
              >
                Tải sơ đồ rút gọn (.svg)
              </button>
              <button
                type="button"
                onClick={() => taiVeSvg(khungDayDu, false)}
                className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium toi:bg-stone-800"
              >
                Tải sơ đồ đầy đủ (.svg)
              </button>
            </div>
            <p className="text-sm text-stone-500">
              File .svg là ảnh vector: phóng to cỡ nào chữ cũng sắc nét, mang ra hàng in khổ A2, A1
              đều được. Mở xem bằng trình duyệt như mở một trang web.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white"
        >
          <Icon ten="in" className="size-5" />
          In / Lưu thành PDF
        </button>
      </div>

      <article className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 print:p-0 print:ring-0 toi:bg-stone-900 toi:ring-stone-800">
        <header className="trang-in mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold">{giaPha?.dongHo.ten}</h1>
          <p className="mt-2 text-stone-600 toi:text-stone-400">Gia phả — thế thứ các đời</p>
          <p className="mt-1 text-sm text-stone-500">
            Bản in ngày {homNay.toLocaleDateString('vi-VN')} · {ci.giaPha.nguoi.length} người ·{' '}
            {ds.length} đời
          </p>
          {giaPha?.dongHo.loiTua && (
            <p className="mx-auto mt-6 max-w-2xl text-left font-serif whitespace-pre-line text-stone-700 toi:text-stone-300">
              {giaPha.dongHo.loiTua}
            </p>
          )}
        </header>

        {coSoDo && gocId && (
          <>
            {/* Không chọn thì thu về chiều cao 0 chứ không gỡ khỏi trang:
                vẫn phải còn đó để nút tải file lấy được màu thật của sơ đồ. */}
            <section
              ref={khungRutGon}
              className={`trang-in mb-8 ${hienRutGon ? '' : 'khong-in h-0 overflow-hidden'}`}
            >
              <h2 className="mb-2 text-center font-serif text-xl font-semibold">
                Sơ đồ rút gọn — dòng nam nối dõi
              </h2>
              <CayGiaPha
                ci={ci}
                gocId={gocId}
                soDoi={99}
                phongTo={1}
                chiConTrai
                choIn
                onChonGoc={() => {}}
              />
            </section>

            <section
              ref={khungDayDu}
              className={`trang-in mb-8 ${hienDayDu ? '' : 'khong-in h-0 overflow-hidden'}`}
            >
              <h2 className="mb-2 text-center font-serif text-xl font-semibold">
                Sơ đồ đầy đủ — cả nam lẫn nữ
              </h2>
              <CayGiaPha
                ci={ci}
                gocId={gocId}
                soDoi={99}
                phongTo={1}
                choIn
                onChonGoc={() => {}}
              />
            </section>
          </>
        )}

        {theoDoi.map(({ doi, nguoi }) => (
          <section key={doi} className="mb-8">
            <h2 className="mb-3 border-b-2 border-amber-800 pb-1 font-serif text-xl font-semibold">
              Đời thứ {doi}
              <span className="ml-2 text-base font-normal text-stone-500">
                ({nguoi.length} người)
              </span>
            </h2>
            <ol className="space-y-4">
              {nguoi.map((p) => {
                const cha = p.chaId ? ci.byId.get(p.chaId) : undefined;
                const me = p.meId ? ci.byId.get(p.meId) : undefined;
                const banDoi = voChongCua(ci, p.id).map((x) => x.nguoi);
                const con = conCuaNguoi(ci, p.id);
                const gio = ngayGioCua(p);
                const namSinh = p.sinh?.duong?.slice(0, 4);
                return (
                  <li key={p.id} className="break-inside-avoid">
                    <div className="font-serif text-lg font-semibold">
                      {p.hoTen}
                      {p.tenThuong && (
                        <span className="font-normal text-stone-600"> (tức {p.tenThuong})</span>
                      )}
                    </div>
                    <div className="text-sm text-stone-600 toi:text-stone-400">
                      {[
                        khoangNam(p),
                        namSinh ? `năm ${canChiNam(Number(namSinh))}` : undefined,
                        p.chiNhanh,
                        p.gioiTinh === 'nu' ? 'nữ' : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <dl className="mt-1 space-y-0.5 text-sm">
                      {(cha || me) && (
                        <div>
                          <span className="text-stone-500">Con của: </span>
                          {[cha?.hoTen, me?.hoTen].filter(Boolean).join(' và ')}
                        </div>
                      )}
                      {banDoi.length > 0 && (
                        <div>
                          <span className="text-stone-500">
                            {p.gioiTinh === 'nu' ? 'Chồng: ' : 'Vợ: '}
                          </span>
                          {banDoi.map((v) => v.hoTen).join(', ')}
                        </div>
                      )}
                      {con.length > 0 && (
                        <div>
                          <span className="text-stone-500">Con ({con.length}): </span>
                          {con.map((c) => c.hoTen).join(', ')}
                        </div>
                      )}
                      {gio && (
                        <div>
                          <span className="text-stone-500">Ngày giỗ: </span>
                          {gio.ngay} tháng {gio.thang} âm lịch
                        </div>
                      )}
                      {keTieuSu && p.queQuan && (
                        <div>
                          <span className="text-stone-500">Quê quán: </span>
                          {p.queQuan}
                        </div>
                      )}
                      {keTieuSu && p.ngheNghiep && (
                        <div>
                          <span className="text-stone-500">Nghề nghiệp: </span>
                          {p.ngheNghiep}
                        </div>
                      )}
                      {keTieuSu && p.moPhan?.nghiaTrang && (
                        <div>
                          <span className="text-stone-500">Phần mộ: </span>
                          {[p.moPhan.nghiaTrang, p.moPhan.moTa].filter(Boolean).join(' — ')}
                        </div>
                      )}
                      {keTieuSu && p.nguon && (
                        <div className="text-stone-500 italic">Nguồn: {p.nguon}</div>
                      )}
                    </dl>
                    {keTieuSu && p.congDuc && (
                      <p className="mt-1 font-serif text-sm text-stone-700 toi:text-stone-300">
                        {p.congDuc}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </article>
    </div>
  );
}
