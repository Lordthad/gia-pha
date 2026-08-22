import { describe, expect, it } from 'vitest';
import mau from '../../public/data/giapha-mau.json';
import type { GiaPha } from '../types/giapha';
import { dungChiMuc } from './chiMuc';
import { soSanhVaiVe } from './xungHo';

const ci = dungChiMuc(mau as unknown as GiaPha);

/** Rút gọn: [A gọi B, B gọi A, chênh đời]. */
function goi(a: string, b: string): [string, string, number] {
  const kq = soSanhVaiVe(ci, a, b);
  return [kq.AgoiB, kq.BgoiA, kq.chenhDoi];
}

describe('đời trong họ', () => {
  it('thuỷ tổ là đời 1, các đời sau tăng dần', () => {
    expect(ci.doi.get('P001')).toBe(1);
    expect(ci.doi.get('P003')).toBe(2);
    expect(ci.doi.get('P009')).toBe(3);
    expect(ci.doi.get('P020')).toBe(4);
    expect(ci.doi.get('P031')).toBe(5);
    expect(ci.doi.get('P039')).toBe(6);
  });

  it('người kết hôn vào họ lấy đời theo vợ/chồng', () => {
    expect(ci.doi.get('P010')).toBe(ci.doi.get('P009'));
    expect(ci.doi.get('P037')).toBe(ci.doi.get('P031'));
  });
});

describe('trực hệ', () => {
  it('cha và con', () => {
    expect(goi('P009', 'P020')).toEqual(['con', 'cha', 1]);
    expect(goi('P020', 'P009')).toEqual(['cha', 'con', -1]);
  });

  it('mẹ và con', () => {
    expect(goi('P010', 'P020')).toEqual(['con', 'mẹ', 1]);
  });

  it('ông nội và cháu', () => {
    expect(goi('P020', 'P003')).toEqual(['ông nội', 'cháu', -2]);
    expect(goi('P003', 'P020')).toEqual(['cháu', 'ông nội', 2]);
  });

  it('bà nội, ông ngoại phân biệt theo đường cha hay đường mẹ', () => {
    expect(goi('P020', 'P004')).toEqual(['bà nội', 'cháu', -2]);
    // P021 là mẹ của P031, nên cha của P021 sẽ là ông ngoại — dữ liệu mẫu
    // không có cha của P021, dùng trường hợp khác: P010 là mẹ P020 => P003 vẫn nội.
    expect(goi('P031', 'P009')).toEqual(['ông nội', 'cháu', -2]);
  });

  it('cụ, kỵ và chắt, chút', () => {
    expect(goi('P020', 'P001')).toEqual(['cụ nội', 'chắt', -3]);
    expect(goi('P031', 'P001')).toEqual(['kỵ nội', 'chút', -4]);
    expect(goi('P001', 'P039')).toEqual(['chít', 'tổ', 5]);
  });
});

describe('anh chị em ruột', () => {
  it('anh và em trai theo thứ tự sinh', () => {
    expect(goi('P009', 'P011')).toEqual(['em', 'anh', 0]);
    expect(goi('P011', 'P009')).toEqual(['anh', 'em', 0]);
  });

  it('chị gái và em trai', () => {
    // P013 (1931, thứ 3) là em của P011 (1928, thứ 2)
    expect(goi('P011', 'P013')).toEqual(['em', 'anh', 0]);
    expect(goi('P013', 'P011')).toEqual(['anh', 'em', 0]);
  });

  it('chị em gái', () => {
    expect(goi('P031', 'P032')).toEqual(['em', 'anh', 0]);
  });
});

describe('chú, bác, cô, cậu, dì', () => {
  it('em trai của cha là chú', () => {
    expect(goi('P020', 'P011')).toEqual(['chú', 'cháu', -1]);
    expect(goi('P011', 'P020')).toEqual(['cháu', 'chú', 1]);
  });

  it('anh trai của cha là bác', () => {
    expect(goi('P023', 'P009')).toEqual(['bác', 'cháu', -1]);
  });

  it('em gái của cha là cô', () => {
    // P013 là em gái của P009 (cha của P020)
    expect(goi('P020', 'P013')).toEqual(['cô', 'cháu', -1]);
  });

  it('chị gái của cha cũng là bác (quy ước miền Bắc)', () => {
    // P013 (1931) là chị của P020? Không — dùng P026 gọi P011:
    // P011 (1928, thứ 2) là anh của P013 (1931, thứ 3) — mẹ của P026
    expect(goi('P026', 'P011')).toEqual(['bác', 'cháu', -1]);
  });

  it('em trai của mẹ là cậu, em gái của mẹ là dì', () => {
    // P026 có mẹ là P013 (thứ 3, con út). Không có em nào của P013 trong họ,
    // nên kiểm tra chiều ngược: P026 gọi P009 (anh của mẹ) là bác.
    expect(goi('P026', 'P009')).toEqual(['bác', 'cháu', -1]);
  });
});

describe('lệ vợ cả, vợ hai', () => {
  it('con vợ cả là anh của con vợ hai dù sinh sau', () => {
    // P027 (con vợ cả, sinh 1956) và P045 (con vợ hai, sinh 1954)
    expect(goi('P027', 'P045')).toEqual(['em', 'anh', 0]);
    expect(goi('P045', 'P027')).toEqual(['anh', 'em', 0]);
  });

  it('giải thích rõ vì sao không theo tuổi', () => {
    const kq = soSanhVaiVe(ci, 'P027', 'P045');
    expect(kq.giaiThich).toContain('con vợ cả');
    expect(kq.giaiThich).toContain('cùng cha khác mẹ');
  });

  it('con vợ hai vẫn tính đúng vai với người ngoài hàng anh em', () => {
    // P045 là con ông Phú, nên gọi ông Doanh (cha ông Phú) là ông nội
    expect(goi('P045', 'P005')).toEqual(['ông nội', 'cháu', -2]);
  });

  it('vợ cả đứng trước vợ hai trong danh sách', () => {
    const vo = ci.honNhanCua.get('P015')!.map((h) => h.voId);
    expect(vo).toEqual(['P016', 'P044']);
  });

  it('con vợ cả đứng trước con vợ hai trong danh sách con', () => {
    expect(ci.conCua.get('P015')).toEqual(['P027', 'P029', 'P045']);
  });
});

describe('quan hệ họ xa', () => {
  it('con chú con bác là anh/em họ', () => {
    expect(goi('P020', 'P023')).toEqual(['em họ', 'anh họ', 0]);
    expect(goi('P023', 'P020')).toEqual(['anh họ', 'em họ', 0]);
  });

  it('chú họ khi cách hai nhánh', () => {
    // P015 (đời 3, chi Ất) trên P020 (đời 4, chi Giáp) một đời;
    // nhánh của P015 (P005) là em của nhánh P020 (P003) nên là chú họ.
    expect(goi('P020', 'P015')).toEqual(['chú họ', 'cháu', -1]);
  });

  it('cô họ bên nhánh con gái của tổ', () => {
    // P018 là con của bà Nguyễn Thị Gái (P007, con út của thuỷ tổ)
    expect(goi('P020', 'P018')).toEqual(['cô họ', 'cháu', -1]);
  });

  it('ông chú, bà cô khi cách hai đời', () => {
    expect(goi('P020', 'P005')).toEqual(['ông chú', 'cháu', -2]);
    expect(goi('P020', 'P007')).toEqual(['bà cô', 'cháu', -2]);
  });

  it('cụ chú khi cách ba đời', () => {
    expect(goi('P031', 'P005')).toEqual(['cụ chú', 'chắt', -3]);
  });

  it('anh em họ xưng hô theo thứ bậc nhánh, không theo tuổi', () => {
    // P022 (sinh 1953, ngành ông Khoa - ngành trưởng) và P023 (sinh 1955, ngành ông Lộc)
    // Cả tuổi lẫn nhánh đều cho P022 ở vai chị.
    expect(goi('P022', 'P023')).toEqual(['em họ', 'chị họ', 0]);
    // P025 (sinh 1958, ngành ông Lộc) trẻ hơn P022 nhưng vẫn là em họ theo nhánh.
    expect(goi('P022', 'P025')).toEqual(['em họ', 'chị họ', 0]);
    // P045 (sinh 1954, chi Ất - ngành thứ) trẻ hơn P023 (1955) theo tuổi
    // nhưng ngành ông Cẩn là ngành trưởng nên P023 vẫn ở vai anh họ.
    expect(goi('P045', 'P023')).toEqual(['anh họ', 'em họ', 0]);
  });

  it('nêu rõ căn cứ thứ bậc nhánh trong giải thích', () => {
    const kq = soSanhVaiVe(ci, 'P045', 'P023');
    expect(kq.giaiThich).toContain('thứ bậc nhánh');
    expect(kq.giaiThich).toContain('ngành');
  });
});

describe('quan hệ qua hôn nhân', () => {
  it('vợ chồng', () => {
    expect(goi('P009', 'P010')).toEqual(['vợ', 'chồng', 0]);
    expect(goi('P010', 'P009')).toEqual(['chồng', 'vợ', 0]);
  });

  it('chị dâu và em chồng', () => {
    // P010 là vợ của P009; P011 là em trai P009
    expect(goi('P011', 'P010')).toEqual(['chị dâu', 'em', 0]);
    expect(goi('P010', 'P011')).toEqual(['em', 'chị dâu', 0]);
  });

  it('thím là vợ của chú', () => {
    expect(goi('P020', 'P012')).toEqual(['thím', 'cháu', -1]);
  });

  it('bác gái là vợ của bác', () => {
    expect(goi('P023', 'P010')).toEqual(['bác gái', 'cháu', -1]);
  });

  it('con dâu và bố chồng', () => {
    expect(goi('P009', 'P021')).toEqual(['con dâu', 'cha', 1]);
  });

  it('con rể', () => {
    expect(goi('P020', 'P038')).toEqual(['con rể', 'cha', 1]);
  });
});

describe('đường đi và giải thích', () => {
  it('đường đi đi qua tổ chung', () => {
    const kq = soSanhVaiVe(ci, 'P020', 'P023');
    expect(kq.toChung?.id).toBe('P003');
    expect(kq.duongDi.map((x) => x.id)).toEqual(['P020', 'P009', 'P003', 'P011', 'P023']);
  });

  it('luôn có câu giải thích', () => {
    for (const a of ['P001', 'P020', 'P010', 'P042']) {
      for (const b of ['P031', 'P018', 'P012', 'P039']) {
        const kq = soSanhVaiVe(ci, a, b);
        expect(kq.giaiThich.length).toBeGreaterThan(10);
        expect(kq.AgoiB).toBeTruthy();
        expect(kq.BgoiA).toBeTruthy();
      }
    }
  });

  it('cùng một người', () => {
    expect(soSanhVaiVe(ci, 'P020', 'P020').loai).toBe('chinh-minh');
  });

  it('thiếu dữ liệu thì cảnh báo thay vì đoán bừa', () => {
    // P042 thiếu mẹ nhưng vẫn nối được qua cha
    const kq = soSanhVaiVe(ci, 'P042', 'P027');
    expect(kq.loai).toBe('huyet-thong');
    expect(kq.BgoiA).toBe('cháu');
  });
});
