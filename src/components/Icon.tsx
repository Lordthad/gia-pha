interface Props {
  ten: TenIcon;
  className?: string;
}

export type TenIcon =
  | 'nha'
  | 'kinh-lup'
  | 'cay'
  | 'vai-ve'
  | 'nhang'
  | 'nguoi'
  | 'banh-rang'
  | 'quay-lai'
  | 'doi-cho'
  | 'ban-do'
  | 'in'
  | 'trang'
  | 'toi'
  | 'dong'
  | 'them'
  | 'luu'
  | 'canh-bao'
  | 'mo-rong'
  | 'thu-gon'
  | 'tai-ve';

const DUONG: Record<TenIcon, string> = {
  nha: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  'kinh-lup': 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 21 21',
  cay: 'M12 3v5m0 0H6.5v4M12 8h5.5v4M4 12h5v4H4zM9.5 16h5v4h-5zM15 12h5v4h-5z',
  'vai-ve': 'M7 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm10 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM7 10v4h10',
  nhang: 'M12 3c2.5 3 4 5 4 7.5a4 4 0 0 1-8 0C8 8 9.5 6 12 3ZM5 20h14',
  nguoi: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5',
  'banh-rang':
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3-.1-1.3 1.8-1.4-1.7-3-2.2.8-1.1-.7-.3-2.3h-3.4l-.3 2.3-1.1.7-2.2-.8-1.7 3L9.5 11 9.4 12l.1 1.3-1.8 1.4 1.7 3 2.2-.8 1.1.7.3 2.3h3.4l.3-2.3 1.1-.7 2.2.8 1.7-3-1.8-1.4Z',
  'quay-lai': 'M15 5l-7 7 7 7',
  'doi-cho': 'M7 8h13l-3-3M17 16H4l3 3',
  'ban-do': 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  in: 'M7 9V3h10v6M7 19H5a2 2 0 0 1-2-2v-5h18v5a2 2 0 0 1-2 2h-2M7 15h10v6H7z',
  trang: 'M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7.9 16.1l-1.4 1.4m11 0-1.4-1.4M7.9 7.9 6.5 6.5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  toi: 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z',
  dong: 'M6 6l12 12M18 6 6 18',
  them: 'M12 5v14M5 12h14',
  luu: 'M5 3h11l3 3v15H5zM8 3v6h7V3M8 21v-7h8v7',
  'canh-bao': 'M12 4 2.5 20h19L12 4Zm0 5v6m0 3v.5',
  'mo-rong': 'M6 9l6 6 6-6',
  'thu-gon': 'M6 15l6-6 6 6',
  'tai-ve': 'M12 4v10m0 0 4-4m-4 4-4-4M5 19h14',
};

export default function Icon({ ten, className = 'size-5' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={DUONG[ten]} />
    </svg>
  );
}
