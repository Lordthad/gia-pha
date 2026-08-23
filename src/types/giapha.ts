export type ID = string;

export type GioiTinh = 'nam' | 'nu' | 'khac';

/** Ngày tháng: có thể chỉ biết năm, hoặc chỉ biết ngày âm. */
export interface NgayThang {
  /**
   * Dương lịch dạng "1943-05-12" | "1943-05" | "1943".
   * Nhớ ngày tháng mà quên năm thì ghi "????-05-12" hoặc "????-05".
   */
  duong?: string;
  am?: { ngay: number; thang: number; nam?: number; nhuan?: boolean };
  khongRo?: boolean;
  /** Ghi chú tự do, ví dụ "khoảng đời Tự Đức" */
  ghiChu?: string;
}

export interface MoPhan {
  moTa?: string;
  nghiaTrang?: string;
  lat?: number;
  lng?: number;
  anh?: string[];
}

export interface Person {
  id: ID;
  hoTen: string;
  /** Tên gọi ở nhà */
  tenThuong?: string;
  /** Tên húy */
  tenHuy?: string;
  /** Tên tự, hiệu, thụy */
  tenTu?: string;
  gioiTinh: GioiTinh;
  /**
   * Đã mất nhưng không ai còn nhớ năm nào. Có ngày mất hoặc ngày giỗ thì
   * không cần đánh dấu, phần mềm tự hiểu.
   */
  daMat?: boolean;
  chaId?: ID | null;
  meId?: ID | null;
  /** Thứ tự sinh trong các con của cha — dùng để phân biệt bác/chú */
  thuTu?: number;
  laConNuoi?: boolean;
  /** Chi/phái trong họ */
  chiNhanh?: string;
  sinh?: NgayThang;
  mat?: NgayThang;
  /** Ngày giỗ âm lịch */
  gioAm?: { ngay: number; thang: number; nhuan?: boolean };
  queQuan?: string;
  noiO?: string;
  ngheNghiep?: string;
  hocVan?: string;
  /** Tiểu sử, công đức, công trạng */
  congDuc?: string;
  moPhan?: MoPhan;
  anhDaiDien?: string;
  anh?: string[];
  /** Nguồn tư liệu, ví dụ "Gia phả bản chép tay 1998, tr. 12" */
  nguon?: string;
  ghiChu?: string;
}

export type TrangThaiHonNhan = 'dang' | 'ly-hon' | 'goa';

export interface HonNhan {
  id: string;
  chongId: ID;
  voId: ID;
  /** 1 = vợ cả, 2 = vợ hai... */
  thuTu?: number;
  ngayCuoi?: NgayThang;
  trangThai?: TrangThaiHonNhan;
  ghiChu?: string;
}

export type QuyUocVung = 'bac' | 'trung' | 'nam';

/** Băm mật khẩu theo PBKDF2, dùng cho mã quản trị. */
export interface BamMa {
  muoi: string;
  bam: string;
  vong: number;
}

/** Gói dữ liệu đã mã hoá bằng mật khẩu xem. */
export interface GoiMaHoa {
  maHoa: 'aes-gcm-256';
  phienBan: 1;
  vong: number;
  muoi: string;
  vector: string;
  duLieu: string;
  /**
   * Mốc cập nhật để ngoài vỏ, không mã hoá, chỉ để máy khác biết trên mạng
   * đã có bản mới hơn hay chưa mà không cần mở khoá.
   */
  capNhat?: string;
}

export interface ThongTinDongHo {
  ten: string;
  thuyToId?: ID;
  quyUocXungHo: QuyUocVung;
  loiTua?: string;
  /** Mã mở khoá mục Quản trị; để trống thì ai mở trang cũng vào được. */
  maQuanTri?: BamMa;
  /**
   * Gia phả này đã đặt mã xem. Ghi vào dữ liệu chứ không để riêng trong từng
   * máy, để máy nào chưa có mã xem thì bị chặn không cho đưa lên mạng — nếu
   * không, chỉ một người đưa lên là cả họ mất lớp mã hoá mà không ai hay.
   */
  yeuCauMaXem?: boolean;
}

export interface GiaPha {
  version: 1;
  dongHo: ThongTinDongHo;
  nguoi: Person[];
  honNhan: HonNhan[];
  /** ISO timestamp lần cập nhật gần nhất */
  capNhat: string;
}
