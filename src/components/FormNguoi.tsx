import { useState } from 'react';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import { voChongCua } from '../lib/chiMuc';
import { luuAnh, nenAnh } from '../lib/luuTru';
import type { GioiTinh, ID, Person } from '../types/giapha';
import AnhNguoi, { useDuongDanAnh } from './AnhNguoi';
import ChonNguoi from './ChonNguoi';
import Icon from './Icon';
import ONgayThang from './ONgayThang';

const O = 'w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-300 toi:bg-stone-950 toi:ring-stone-700';

function Truong({
  nhan,
  goiY,
  children,
}: {
  nhan: string;
  goiY?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-600 toi:text-stone-400">
        {nhan}
      </span>
      {children}
      {goiY && <span className="mt-1 block text-xs text-stone-500">{goiY}</span>}
    </label>
  );
}

function OAnh({ duongDan, onXoa }: { duongDan: string; onXoa: () => void }) {
  const url = useDuongDanAnh(duongDan);
  return (
    <div className="relative">
      {url && (
        <img src={url} alt="" className="size-24 rounded-lg object-cover ring-1 ring-stone-300" />
      )}
      <button
        type="button"
        onClick={onXoa}
        className="absolute -top-2 -right-2 grid !min-h-0 size-7 place-items-center rounded-full bg-red-600 text-white"
        aria-label="Bỏ ảnh"
      >
        <Icon ten="dong" className="size-4" />
      </button>
    </div>
  );
}

interface Props {
  nguoi: Person;
  onLuu: (p: Person) => void;
  onXoa?: () => void;
  onDong: () => void;
  onThemHonNhan: (idKia: ID) => void;
  onXoaHonNhan: (hnId: string) => void;
}

export default function FormNguoi({
  nguoi,
  onLuu,
  onXoa,
  onDong,
  onThemHonNhan,
  onXoaHonNhan,
}: Props) {
  const ci = useChiMuc();
  const [p, datP] = useState<Person>({ ...nguoi });
  const [dangTai, datDangTai] = useState(false);
  const [themBanDoi, datThemBanDoi] = useState<ID>();

  const dat = <K extends keyof Person>(khoa: K, gt: Person[K]) => datP((x) => ({ ...x, [khoa]: gt }));

  const datMo = (khoa: 'moTa' | 'nghiaTrang' | 'lat' | 'lng', gt: string) => {
    datP((x) => {
      const mo = { ...(x.moPhan ?? {}) };
      if (khoa === 'lat' || khoa === 'lng') {
        const so = Number(gt);
        if (gt === '' || Number.isNaN(so)) delete mo[khoa];
        else mo[khoa] = so;
      } else if (gt) mo[khoa] = gt;
      else delete mo[khoa];
      return { ...x, moPhan: Object.keys(mo).length ? mo : undefined };
    });
  };

  const tepAnh = async (tep: File | undefined, daiDien: boolean) => {
    if (!tep) return;
    datDangTai(true);
    try {
      const dataUrl = await nenAnh(tep);
      const duoi = 'jpg';
      const duongDan = `media/${p.id}-${Date.now()}.${duoi}`;
      await luuAnh(duongDan, dataUrl);
      if (daiDien) dat('anhDaiDien', duongDan);
      else dat('anh', [...(p.anh ?? []), duongDan]);
    } catch {
      alert('Không đọc được ảnh này. Thử chọn ảnh khác.');
    } finally {
      datDangTai(false);
    }
  };

  const banDoi = voChongCua(ci, p.id);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!p.hoTen.trim()) return;
        onLuu(p);
      }}
    >
      <section className="grid gap-3 sm:grid-cols-2">
        <Truong nhan="Họ và tên *">
          <input
            required
            value={p.hoTen}
            onChange={(e) => dat('hoTen', e.target.value)}
            className={O}
          />
        </Truong>
        <Truong nhan="Tên thường gọi">
          <input
            value={p.tenThuong ?? ''}
            onChange={(e) => dat('tenThuong', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Tên húy">
          <input
            value={p.tenHuy ?? ''}
            onChange={(e) => dat('tenHuy', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Tên tự, hiệu">
          <input
            value={p.tenTu ?? ''}
            onChange={(e) => dat('tenTu', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Giới tính">
          <select
            value={p.gioiTinh}
            onChange={(e) => dat('gioiTinh', e.target.value as GioiTinh)}
            className={O}
          >
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
            <option value="khac">Khác</option>
          </select>
        </Truong>
        <Truong nhan="Chi / nhánh">
          <input
            value={p.chiNhanh ?? ''}
            onChange={(e) => dat('chiNhanh', e.target.value || undefined)}
            className={O}
          />
        </Truong>
      </section>

      <section className="space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800">
        <h3 className="font-medium">Cha mẹ và thứ tự sinh</h3>
        <ChonNguoi
          nhan="Cha"
          giaTri={p.chaId ?? undefined}
          onChon={(id) => dat('chaId', id ?? null)}
          loaiTru={[p.id]}
        />
        <ChonNguoi
          nhan="Mẹ"
          giaTri={p.meId ?? undefined}
          onChon={(id) => dat('meId', id ?? null)}
          loaiTru={[p.id]}
        />
        <Truong
          nhan="Thứ tự sinh trong các con"
          goiY="Con cả ghi 1, con thứ hai ghi 2... Dùng để phân biệt bác với chú khi không rõ năm sinh."
        >
          <input
            type="number"
            min={1}
            value={p.thuTu ?? ''}
            onChange={(e) => dat('thuTu', e.target.value ? Number(e.target.value) : undefined)}
            className={O}
          />
        </Truong>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(p.laConNuoi)}
            onChange={(e) => dat('laConNuoi', e.target.checked || undefined)}
            className="!min-h-0 size-5"
          />
          Là con nuôi
        </label>
      </section>

      <section className="space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800">
        <h3 className="font-medium">Vợ / chồng</h3>
        {banDoi.length > 0 && (
          <ul className="space-y-2">
            {banDoi.map((x) => (
              <li
                key={x.honNhan.id}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800"
              >
                <AnhNguoi nguoi={x.nguoi} co="nho" />
                <span className="min-w-0 flex-1 truncate">{x.nguoi.hoTen}</span>
                <button
                  type="button"
                  onClick={() => onXoaHonNhan(x.honNhan.id)}
                  className="rounded-lg px-3 text-sm font-medium text-red-700"
                >
                  Bỏ
                </button>
              </li>
            ))}
          </ul>
        )}
        <ChonNguoi
          nhan="Thêm vợ/chồng"
          giaTri={themBanDoi}
          onChon={(id) => datThemBanDoi(id)}
          loaiTru={[p.id, ...banDoi.map((x) => x.nguoi.id)]}
        />
        {themBanDoi && (
          <button
            type="button"
            onClick={() => {
              onThemHonNhan(themBanDoi);
              datThemBanDoi(undefined);
            }}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white toi:bg-stone-700"
          >
            Thêm quan hệ vợ chồng
          </button>
        )}
        <p className="text-xs text-stone-500">
          Người chưa có trong gia phả thì tạo mới trước, rồi quay lại đây để nối.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <ONgayThang
          nhan="Ngày sinh (dương lịch)"
          giaTri={p.sinh}
          onDoi={(nt) => dat('sinh', nt)}
          goiY="Chỉ nhớ mỗi năm thì ghi mỗi năm cũng được."
        />
        <ONgayThang nhan="Ngày mất (dương lịch)" giaTri={p.mat} onDoi={(nt) => dat('mat', nt)} />
        <Truong nhan="Ngày giỗ âm lịch — ngày" goiY="Để trống thì phần mềm tự quy đổi từ ngày mất.">
          <input
            type="number"
            min={1}
            max={30}
            value={p.gioAm?.ngay ?? ''}
            onChange={(e) =>
              dat(
                'gioAm',
                e.target.value
                  ? { ngay: Number(e.target.value), thang: p.gioAm?.thang ?? 1, nhuan: p.gioAm?.nhuan }
                  : undefined,
              )
            }
            className={O}
          />
        </Truong>
        <Truong nhan="Ngày giỗ âm lịch — tháng">
          <input
            type="number"
            min={1}
            max={12}
            value={p.gioAm?.thang ?? ''}
            onChange={(e) =>
              dat(
                'gioAm',
                e.target.value
                  ? { ngay: p.gioAm?.ngay ?? 1, thang: Number(e.target.value), nhuan: p.gioAm?.nhuan }
                  : undefined,
              )
            }
            className={O}
          />
        </Truong>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Truong nhan="Quê quán">
          <input
            value={p.queQuan ?? ''}
            onChange={(e) => dat('queQuan', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Nơi ở">
          <input
            value={p.noiO ?? ''}
            onChange={(e) => dat('noiO', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Nghề nghiệp">
          <input
            value={p.ngheNghiep ?? ''}
            onChange={(e) => dat('ngheNghiep', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Học vấn">
          <input
            value={p.hocVan ?? ''}
            onChange={(e) => dat('hocVan', e.target.value || undefined)}
            className={O}
          />
        </Truong>
      </section>

      <Truong nhan="Tiểu sử, công đức">
        <textarea
          rows={4}
          value={p.congDuc ?? ''}
          onChange={(e) => dat('congDuc', e.target.value || undefined)}
          className={O}
        />
      </Truong>

      <section className="space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800">
        <h3 className="font-medium">Phần mộ</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Truong nhan="Nghĩa trang">
            <input
              value={p.moPhan?.nghiaTrang ?? ''}
              onChange={(e) => datMo('nghiaTrang', e.target.value)}
              className={O}
            />
          </Truong>
          <Truong nhan="Mô tả vị trí">
            <input
              value={p.moPhan?.moTa ?? ''}
              onChange={(e) => datMo('moTa', e.target.value)}
              className={O}
            />
          </Truong>
          <Truong nhan="Vĩ độ (lat)" goiY="Lấy từ Google Maps: bấm giữ vào mộ để hiện toạ độ.">
            <input
              value={p.moPhan?.lat ?? ''}
              onChange={(e) => datMo('lat', e.target.value)}
              placeholder="21.1214"
              className={O}
            />
          </Truong>
          <Truong nhan="Kinh độ (lng)">
            <input
              value={p.moPhan?.lng ?? ''}
              onChange={(e) => datMo('lng', e.target.value)}
              placeholder="105.9542"
              className={O}
            />
          </Truong>
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200 toi:bg-stone-950 toi:ring-stone-800">
        <h3 className="font-medium">Ảnh</h3>
        <div className="flex items-center gap-4">
          <AnhNguoi nguoi={p} co="vua" />
          <label className="cursor-pointer rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-white toi:bg-stone-700">
            {dangTai ? 'Đang xử lý...' : 'Chọn ảnh chân dung'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => tepAnh(e.target.files?.[0], true)}
            />
          </label>
          {p.anhDaiDien && (
            <button
              type="button"
              onClick={() => dat('anhDaiDien', undefined)}
              className="text-sm font-medium text-red-700"
            >
              Bỏ ảnh
            </button>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {(p.anh ?? []).map((a) => (
              <OAnh
                key={a}
                duongDan={a}
                onXoa={() => dat('anh', (p.anh ?? []).filter((x) => x !== a))}
              />
            ))}
          </div>
          <label className="inline-block cursor-pointer rounded-xl bg-stone-200 px-4 py-2.5 text-sm font-medium toi:bg-stone-800">
            Thêm ảnh tư liệu
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => tepAnh(e.target.files?.[0], false)}
            />
          </label>
        </div>
        <p className="text-xs text-stone-500">
          Ảnh được thu nhỏ và giữ trong máy. Nhớ bấm “Xuất dữ liệu” ở tab Xuất/Nhập để đóng gói ảnh
          kèm gia phả.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Truong nhan="Nguồn tư liệu" goiY="Ví dụ: Gia phả bản chép tay 1998, tr. 12">
          <input
            value={p.nguon ?? ''}
            onChange={(e) => dat('nguon', e.target.value || undefined)}
            className={O}
          />
        </Truong>
        <Truong nhan="Ghi chú">
          <input
            value={p.ghiChu ?? ''}
            onChange={(e) => dat('ghiChu', e.target.value || undefined)}
            className={O}
          />
        </Truong>
      </section>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-stone-200 bg-white px-4 py-3 toi:border-stone-800 toi:bg-stone-900">
        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 font-medium text-white"
        >
          <Icon ten="luu" className="size-5" />
          Lưu
        </button>
        <button
          type="button"
          onClick={onDong}
          className="rounded-xl bg-stone-100 px-4 py-2.5 font-medium toi:bg-stone-800"
        >
          Đóng
        </button>
        {onXoa && (
          <button
            type="button"
            onClick={onXoa}
            className="rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 toi:bg-red-950 toi:text-red-300"
          >
            Xoá
          </button>
        )}
      </div>
    </form>
  );
}
