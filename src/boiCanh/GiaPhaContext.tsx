import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { kiemTraMa } from '../lib/baoMat';
import { dungChiMuc, type ChiMuc } from '../lib/chiMuc';
import {
  luuBanNhap,
  matKhauDaNho,
  moKhoaGiaPha,
  napGiaPha,
  nhoMatKhau,
  quenMatKhau,
  xoaBanNhap,
} from '../lib/luuTru';
import type { GiaPha, GoiMaHoa } from '../types/giapha';

interface BoiCanhGiaPha {
  giaPha?: GiaPha;
  ci?: ChiMuc;
  dangTai: boolean;
  loi?: string;
  /** Đang dùng bản nháp chưa xuất ra file. */
  tuBanNhap: boolean;
  /** File dữ liệu đang mã hoá và chưa mở khoá. */
  goiMaHoa?: GoiMaHoa;
  /** Mật khẩu xem đang dùng; cần khi xuất để mã hoá lại. */
  matKhauXem?: string;
  moKhoa: (matKhau: string, nhoMay: boolean) => Promise<boolean>;
  datMatKhauXem: (matKhau?: string) => void;
  /** Mục Quản trị đã được mở khoá trong phiên này. */
  quanTriMoKhoa: boolean;
  /**
   * Mã quản trị đang dùng, chỉ giữ trong bộ nhớ của phiên làm việc.
   * Cần để mở khoá mã truy cập GitHub; không bao giờ ghi xuống đĩa.
   */
  maQuanTriDangDung?: string;
  moKhoaQuanTri: (ma: string) => Promise<boolean>;
  /** Mở khoá sau khi tự đặt mã mới, hoặc khoá lại ngay. */
  datQuanTriMoKhoa: (v: boolean, ma?: string) => void;
  capNhat: (gp: GiaPha) => void;
  boBanNhap: () => Promise<void>;
}

const Boi = createContext<BoiCanhGiaPha | undefined>(undefined);

export function GiaPhaProvider({ children }: { children: ReactNode }) {
  const [giaPha, datGiaPha] = useState<GiaPha>();
  const [dangTai, datDangTai] = useState(true);
  const [loi, datLoi] = useState<string>();
  const [tuBanNhap, datTuBanNhap] = useState(false);
  const [goiMaHoa, datGoiMaHoa] = useState<GoiMaHoa>();
  const [matKhauXem, datMatKhau] = useState<string>();
  const [quanTriMoKhoa, datMoKhoa] = useState(false);
  const [maQuanTriDangDung, datMaDangDung] = useState<string>();

  useEffect(() => {
    let huy = false;
    napGiaPha()
      .then((kq) => {
        if (huy) return;
        datGiaPha(kq.giaPha);
        datTuBanNhap(kq.tuBanNhap);
        datGoiMaHoa(kq.goiMaHoa);
        // Mã xem là thiết lập của người quản trị, không phụ thuộc dữ liệu đang xem
        // lấy từ đâu. Phải nạp lại kể cả khi đang có bản nháp, nếu không thì hễ
        // sửa gì đó rồi mở lại là mã xem biến mất và bản đưa lên mạng hết mã hoá.
        datMatKhau(matKhauDaNho());
      })
      .catch((e: unknown) => {
        if (!huy) datLoi(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!huy) datDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, []);

  const moKhoa = useCallback(
    async (matKhau: string, nhoMay: boolean) => {
      if (!goiMaHoa) return false;
      try {
        const gp = await moKhoaGiaPha(goiMaHoa, matKhau);
        datGiaPha(gp);
        datGoiMaHoa(undefined);
        datMatKhau(matKhau);
        nhoMatKhau(matKhau, nhoMay);
        return true;
      } catch {
        return false;
      }
    },
    [goiMaHoa],
  );

  const datMatKhauXem = useCallback((matKhau?: string) => {
    datMatKhau(matKhau);
    // Giữ lâu dài: đây là người quản trị đang đặt mã cho cả họ trên máy của mình,
    // đóng trình duyệt rồi mở lại vẫn phải còn.
    if (matKhau) nhoMatKhau(matKhau, true);
    else quenMatKhau();
  }, []);

  const moKhoaQuanTri = useCallback(
    async (ma: string) => {
      const luu = giaPha?.dongHo.maQuanTri;
      if (!luu) return true;
      const dung = await kiemTraMa(ma, luu);
      if (dung) {
        datMoKhoa(true);
        datMaDangDung(ma);
      }
      return dung;
    },
    [giaPha],
  );

  const datQuanTriMoKhoa = useCallback((v: boolean, ma?: string) => {
    datMoKhoa(v);
    datMaDangDung(v ? ma : undefined);
  }, []);

  const capNhat = useCallback((gp: GiaPha) => {
    const moi = { ...gp, capNhat: new Date().toISOString() };
    datGiaPha(moi);
    luuBanNhap(moi);
    datTuBanNhap(true);
  }, []);

  const boBanNhap = useCallback(async () => {
    xoaBanNhap();
    datDangTai(true);
    try {
      const kq = await napGiaPha();
      datGiaPha(kq.giaPha);
      datGoiMaHoa(kq.goiMaHoa);
      datTuBanNhap(false);
      datLoi(undefined);
    } catch (e) {
      datLoi(e instanceof Error ? e.message : String(e));
    } finally {
      datDangTai(false);
    }
  }, []);

  const ci = useMemo(() => (giaPha ? dungChiMuc(giaPha) : undefined), [giaPha]);

  const giaTri = useMemo(
    () => ({
      giaPha,
      ci,
      dangTai,
      loi,
      tuBanNhap,
      goiMaHoa,
      matKhauXem,
      moKhoa,
      datMatKhauXem,
      quanTriMoKhoa,
      maQuanTriDangDung,
      moKhoaQuanTri,
      datQuanTriMoKhoa,
      capNhat,
      boBanNhap,
    }),
    [
      giaPha,
      ci,
      dangTai,
      loi,
      tuBanNhap,
      goiMaHoa,
      matKhauXem,
      moKhoa,
      datMatKhauXem,
      quanTriMoKhoa,
      maQuanTriDangDung,
      moKhoaQuanTri,
      datQuanTriMoKhoa,
      capNhat,
      boBanNhap,
    ],
  );

  return <Boi.Provider value={giaTri}>{children}</Boi.Provider>;
}

export function useGiaPha(): BoiCanhGiaPha {
  const b = useContext(Boi);
  if (!b) throw new Error('useGiaPha phải nằm trong GiaPhaProvider');
  return b;
}

/** Dùng khi chắc chắn dữ liệu đã nạp xong (các trang bên trong Layout). */
export function useChiMuc(): ChiMuc {
  const { ci } = useGiaPha();
  if (!ci) throw new Error('Dữ liệu gia phả chưa sẵn sàng');
  return ci;
}
