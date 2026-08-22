import { Link } from 'react-router-dom';
import { useChiMuc } from '../boiCanh/GiaPhaContext';
import { daMat, khoangNam } from '../lib/chiMuc';
import type { Person } from '../types/giapha';
import AnhNguoi from './AnhNguoi';

interface Props {
  nguoi: Person;
  /** Dòng chữ phụ thay cho năm sinh–mất, ví dụ vai vế trong quan hệ. */
  phu?: string;
  onClick?: () => void;
  hienDoi?: boolean;
}

export function DongNguoi({ nguoi, phu, onClick, hienDoi = true }: Props) {
  const ci = useChiMuc();
  const doi = ci.doi.get(nguoi.id);
  const nam = khoangNam(nguoi);

  const noiDung = (
    <>
      <AnhNguoi nguoi={nguoi} co="nho" />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{nguoi.hoTen}</span>
          {nguoi.tenThuong && (
            <span className="text-sm text-stone-500 toi:text-stone-400">({nguoi.tenThuong})</span>
          )}
        </div>
        <div className="truncate text-sm text-stone-600 toi:text-stone-400">
          {phu ?? (
            <>
              {hienDoi && doi != null && <span>Đời {doi}</span>}
              {nam && <span>{hienDoi && doi != null ? ' · ' : ''}{nam}</span>}
              {nguoi.chiNhanh && <span> · {nguoi.chiNhanh}</span>}
              {!daMat(nguoi) && !nam && <span>Còn sống</span>}
            </>
          )}
        </div>
      </div>
    </>
  );

  const lop =
    'flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-stone-200 transition hover:bg-amber-50 toi:bg-stone-900 toi:ring-stone-800 toi:hover:bg-stone-800';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={lop}>
        {noiDung}
      </button>
    );
  }
  return (
    <Link to={`/nguoi/${nguoi.id}`} className={lop}>
      {noiDung}
    </Link>
  );
}

/** Danh sách người dạng đứng, dùng chung cho nhiều trang. */
export function DanhSachNguoi({
  ds,
  phu,
  rong,
}: {
  ds: Person[];
  phu?: (p: Person) => string | undefined;
  rong?: string;
}) {
  if (ds.length === 0) {
    return (
      <p className="rounded-xl bg-white px-4 py-6 text-center text-stone-500 ring-1 ring-stone-200 toi:bg-stone-900 toi:text-stone-400 toi:ring-stone-800">
        {rong ?? 'Không có ai.'}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {ds.map((p) => (
        <li key={p.id}>
          <DongNguoi nguoi={p} phu={phu?.(p)} />
        </li>
      ))}
    </ul>
  );
}
