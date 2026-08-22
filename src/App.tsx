import { Route, Routes } from 'react-router-dom';
import { useGiaPha } from './boiCanh/GiaPhaContext';
import Layout from './components/Layout';
import ManHinhMatKhau from './components/ManHinhMatKhau';
import HoSoNguoi from './pages/HoSoNguoi';
import LichGio from './pages/LichGio';
import QuanTri from './pages/QuanTri';
import SoVaiVe from './pages/SoVaiVe';
import TimKiem from './pages/TimKiem';
import TrangCay from './pages/TrangCay';
import TrangChu from './pages/TrangChu';
import TrangIn from './pages/TrangIn';

export default function App() {
  const { dangTai, loi, ci, goiMaHoa } = useGiaPha();

  if (dangTai) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="text-stone-500">Đang mở gia phả...</p>
      </div>
    );
  }

  if (goiMaHoa) {
    return <ManHinhMatKhau />;
  }

  if (loi || !ci) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="font-serif text-xl font-semibold">Không mở được dữ liệu gia phả</h1>
          <p className="text-stone-600 toi:text-stone-400">{loi}</p>
          <p className="text-sm text-stone-500">
            Kiểm tra lại file <code>public/data/giapha.json</code>, hoặc mở website qua máy chủ
            thay vì mở trực tiếp file trên máy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TrangChu />} />
        <Route path="/tim-kiem" element={<TimKiem />} />
        <Route path="/nguoi/:id" element={<HoSoNguoi />} />
        <Route path="/cay" element={<TrangCay />} />
        <Route path="/cay/:id" element={<TrangCay />} />
        <Route path="/vai-ve" element={<SoVaiVe />} />
        <Route path="/gio" element={<LichGio />} />
        <Route path="/quan-tri" element={<QuanTri />} />
        <Route path="/in" element={<TrangIn />} />
        <Route path="*" element={<TrangChu />} />
      </Routes>
    </Layout>
  );
}
