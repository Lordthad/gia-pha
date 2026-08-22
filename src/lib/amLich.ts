/**
 * Chuyển đổi âm lịch – dương lịch theo thuật toán của Hồ Ngọc Đức,
 * dùng múi giờ Việt Nam (UTC+7) nên khớp với lịch in trong nước.
 */

const MUI_GIO = 7;
const PI = Math.PI;

const nguyen = (d: number) => Math.floor(d);

export interface NgayAm {
  ngay: number;
  thang: number;
  nam: number;
  nhuan: boolean;
}

/** Số ngày Julius từ ngày dương lịch. */
export function jdTuNgay(dd: number, mm: number, yy: number): number {
  const a = nguyen((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    nguyen((153 * m + 2) / 5) +
    365 * y +
    nguyen(y / 4) -
    nguyen(y / 100) +
    nguyen(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + nguyen((153 * m + 2) / 5) + 365 * y + nguyen(y / 4) - 32083;
  }
  return jd;
}

/** Ngày dương lịch [ngày, tháng, năm] từ số ngày Julius. */
export function ngayTuJd(jd: number): [number, number, number] {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = nguyen((4 * a + 3) / 146097);
    c = a - nguyen((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = nguyen((4 * c + 3) / 1461);
  const e = c - nguyen((1461 * d) / 4);
  const m = nguyen((5 * e + 2) / 153);
  const ngay = e - nguyen((153 * m + 2) / 5) + 1;
  const thang = m + 3 - 12 * nguyen(m / 10);
  const nam = b * 100 + d - 4800 + nguyen(m / 10);
  return [ngay, thang, nam];
}

/** Thời điểm sóc (trăng mới) thứ k tính từ 1/1/1900. */
function trangMoi(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.6705065 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + c1 - deltat;
}

/** Kinh độ mặt trời (radian). */
function kinhDoMatTroi(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  dl = dl + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + dl) * dr;
  L = L - PI * 2 * nguyen(L / (PI * 2));
  return L;
}

function gocMatTroi(soNgay: number): number {
  return nguyen((kinhDoMatTroi(soNgay - 0.5 - MUI_GIO / 24) / PI) * 6);
}

function ngayTrangMoi(k: number): number {
  return nguyen(trangMoi(k) + 0.5 + MUI_GIO / 24);
}

/** Ngày bắt đầu tháng 11 âm lịch của năm dương `yy`. */
function thangMotMot(yy: number): number {
  const off = jdTuNgay(31, 12, yy) - 2415021;
  const k = nguyen(off / 29.530588853);
  let nm = ngayTrangMoi(k);
  if (gocMatTroi(nm) >= 9) nm = ngayTrangMoi(k - 1);
  return nm;
}

/** Vị trí tháng nhuận trong năm âm bắt đầu từ mốc a11. */
function viTriThangNhuan(a11: number): number {
  const k = nguyen((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = gocMatTroi(ngayTrangMoi(k + i));
  do {
    last = arc;
    i++;
    arc = gocMatTroi(ngayTrangMoi(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Dương lịch sang âm lịch. */
export function duongSangAm(dd: number, mm: number, yy: number): NgayAm {
  const soNgay = jdTuNgay(dd, mm, yy);
  const k = nguyen((soNgay - 2415021.076998695) / 29.530588853);
  let dauThang = ngayTrangMoi(k + 1);
  if (dauThang > soNgay) dauThang = ngayTrangMoi(k);
  let a11 = thangMotMot(yy);
  let b11 = a11;
  let namAm: number;
  if (a11 >= dauThang) {
    namAm = yy;
    a11 = thangMotMot(yy - 1);
  } else {
    namAm = yy + 1;
    b11 = thangMotMot(yy + 1);
  }
  const ngayAm = soNgay - dauThang + 1;
  const chenh = nguyen((dauThang - a11) / 29);
  let nhuan = false;
  let thangAm = chenh + 11;
  if (b11 - a11 > 365) {
    const viTri = viTriThangNhuan(a11);
    if (chenh >= viTri) {
      thangAm = chenh + 10;
      if (chenh === viTri) nhuan = true;
    }
  }
  if (thangAm > 12) thangAm -= 12;
  if (thangAm >= 11 && chenh < 4) namAm -= 1;
  return { ngay: ngayAm, thang: thangAm, nam: namAm, nhuan };
}

/** Âm lịch sang dương lịch. Trả về undefined nếu tháng nhuận đó không tồn tại. */
export function amSangDuong(
  ngay: number,
  thang: number,
  nam: number,
  nhuan = false,
): [number, number, number] | undefined {
  let a11: number;
  let b11: number;
  if (thang < 11) {
    a11 = thangMotMot(nam - 1);
    b11 = thangMotMot(nam);
  } else {
    a11 = thangMotMot(nam);
    b11 = thangMotMot(nam + 1);
  }
  let off = thang - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const viTri = viTriThangNhuan(a11);
    let thangNhuan = viTri - 2;
    if (thangNhuan < 0) thangNhuan += 12;
    if (nhuan && thang !== thangNhuan) return undefined;
    if (nhuan || off >= viTri) off += 1;
  } else if (nhuan) {
    return undefined;
  }
  const k = nguyen(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  const dauThang = ngayTrangMoi(k + off);
  return ngayTuJd(dauThang + ngay - 1);
}

/* ---------------- Tiện ích ---------------- */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export function canChiNam(namAm: number): string {
  return `${CAN[(namAm + 6) % 10]} ${CHI[(namAm + 8) % 12]}`;
}

/** Chuỗi hiển thị: "ngày 12 tháng 8 (nhuận) năm Mậu Dần" */
export function chuoiAmLich(a: NgayAm, keNam = true): string {
  const nhuan = a.nhuan ? ' nhuận' : '';
  const nam = keNam ? ` năm ${canChiNam(a.nam)}` : '';
  return `ngày ${a.ngay} tháng ${a.thang}${nhuan}${nam}`;
}

export function amCuaNgay(d: Date): NgayAm {
  return duongSangAm(d.getDate(), d.getMonth() + 1, d.getFullYear());
}

/** Ngày dương của một ngày âm trong năm dương `namDuong`. */
export function ngayDuongCuaNgayAm(
  ngay: number,
  thang: number,
  namDuong: number,
  nhuan = false,
): Date | undefined {
  const kq = amSangDuong(ngay, thang, namDuong, nhuan);
  if (!kq) return undefined;
  const [d, m, y] = kq;
  return new Date(y, m - 1, d);
}

/**
 * Ngày giỗ kế tiếp tính từ `moc`.
 * Tháng nhuận không có trong năm đó thì lùi về tháng thường tương ứng.
 */
export function gioKeTiep(
  gio: { ngay: number; thang: number; nhuan?: boolean },
  moc: Date = new Date(),
): Date {
  const homNay = new Date(moc.getFullYear(), moc.getMonth(), moc.getDate());
  for (let i = 0; i < 3; i++) {
    const nam = homNay.getFullYear() + i;
    const d =
      ngayDuongCuaNgayAm(gio.ngay, gio.thang, nam, gio.nhuan) ??
      ngayDuongCuaNgayAm(gio.ngay, gio.thang, nam, false);
    if (d && d.getTime() >= homNay.getTime()) return d;
  }
  return homNay;
}

const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/** "Thứ ba, 12/08/2026" */
export function chuoiDuongLich(d: Date, keThu = true): string {
  const hai = (n: number) => String(n).padStart(2, '0');
  const ngay = `${hai(d.getDate())}/${hai(d.getMonth() + 1)}/${d.getFullYear()}`;
  return keThu ? `${THU[d.getDay()]}, ${ngay}` : ngay;
}

/** Số ngày còn lại từ hôm nay tới `d`. */
export function conBaoNhieuNgay(d: Date, moc: Date = new Date()): number {
  const a = new Date(moc.getFullYear(), moc.getMonth(), moc.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}
