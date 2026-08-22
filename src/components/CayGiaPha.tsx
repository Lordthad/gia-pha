import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  conCuaNguoi,
  daMat,
  khoangNam,
  voChongCua,
  type BanDoi,
  type ChiMuc,
} from '../lib/chiMuc';
import type { ID, Person } from '../types/giapha';

const RONG_O = 148;
const CAO_O = 58;
const CACH_NGANG = 12;
const CACH_DOC = 132;
const CACH_DOC_SUA = 184;
const CHO_THEM_VO = 80;

const THU_TU_VO = ['cả', 'hai', 'ba', 'tư', 'năm', 'sáu'];

/** "vợ cả", "vợ hai"... khi có nhiều vợ; chỉ một người thì gọi "vợ" / "chồng". */
function nhanBanDoi(p: Person, i: number, tong: number): string {
  const goc = p.gioiTinh === 'nu' ? 'vợ' : 'chồng';
  if (tong <= 1) return goc;
  return `${goc} ${THU_TU_VO[i] ?? i + 1}`;
}

interface NutCay {
  id: ID;
  nguoi: Person;
  banDoi: BanDoi[];
  rong: number;
  con: NutCay[];
  /** Còn con chưa hiển thị vì đã chạm giới hạn số đời. */
  conAn: number;
}

function dungNut(ci: ChiMuc, id: ID, sauConLai: number, daQua: Set<ID>): NutCay {
  const nguoi = ci.byId.get(id)!;
  daQua.add(id);
  const banDoi = voChongCua(ci, id);
  const conTatCa = conCuaNguoi(ci, id).filter((c) => !daQua.has(c.id));
  const con = sauConLai > 0 ? conTatCa.map((c) => dungNut(ci, c.id, sauConLai - 1, daQua)) : [];
  return {
    id,
    nguoi,
    banDoi,
    rong: RONG_O * (1 + banDoi.length) + CACH_NGANG * banDoi.length,
    con,
    conAn: sauConLai > 0 ? 0 : conTatCa.length,
  };
}

interface Props {
  ci: ChiMuc;
  gocId: ID;
  soDoi: number;
  phongTo: number;
  onChonGoc: (id: ID) => void;
  onKichThuoc?: (rong: number) => void;
  /** Bật các nút thêm người ngay trên sơ đồ. */
  cheDoSua?: boolean;
  onSua?: (id: ID) => void;
  onThemCon?: (chaMeId: ID) => void;
  onThemBanDoi?: (nguoiId: ID) => void;
  onThemChaMe?: (conId: ID) => void;
}

/** Nút bấm nhỏ vẽ bằng SVG, dùng cho các thao tác thêm người trên sơ đồ. */
function NutSvg({
  x,
  y,
  rong,
  nhan,
  onClick,
  mau = 'amber',
}: {
  x: number;
  y: number;
  rong: number;
  nhan: string;
  onClick: () => void;
  mau?: 'amber' | 'rose' | 'stone';
}) {
  const nen =
    mau === 'rose'
      ? 'fill-rose-50 stroke-rose-400 toi:fill-rose-950 toi:stroke-rose-700'
      : mau === 'stone'
        ? 'fill-stone-50 stroke-stone-400 toi:fill-stone-800 toi:stroke-stone-600'
        : 'fill-amber-50 stroke-amber-500 toi:fill-amber-950 toi:stroke-amber-700';
  const chu =
    mau === 'rose'
      ? 'fill-rose-800 toi:fill-rose-300'
      : mau === 'stone'
        ? 'fill-stone-700 toi:fill-stone-300'
        : 'fill-amber-900 toi:fill-amber-300';
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <rect width={rong} height={24} rx={12} className={nen} strokeWidth={1.2} />
      <text x={rong / 2} y={16} textAnchor="middle" className={`${chu} text-[11px] font-medium`}>
        {nhan}
      </text>
    </g>
  );
}

/** Sơ đồ cây gia phả vẽ bằng SVG; vợ chồng đứng cạnh nhau trong một cụm. */
export default function CayGiaPha({
  ci,
  gocId,
  soDoi,
  phongTo,
  onChonGoc,
  onKichThuoc,
  cheDoSua = false,
  onSua,
  onThemCon,
  onThemBanDoi,
  onThemChaMe,
}: Props) {
  const dieuHuong = useNavigate();
  const cachDoc = cheDoSua ? CACH_DOC_SUA : CACH_DOC;

  const { nut, rong, cao, leX, leY } = useMemo(() => {
    const duLieu = dungNut(ci, gocId, soDoi - 1, new Set());
    const goc = hierarchy<NutCay>(duLieu, (d) => d.con);
    const boCuc = tree<NutCay>()
      .nodeSize([1, cachDoc])
      .separation((a, b) => (a.data.rong + b.data.rong) / 2 + 28);
    boCuc(goc);

    const ds = goc.descendants() as Array<HierarchyPointNode<NutCay>>;
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = 0;
    for (const n of ds) {
      minX = Math.min(minX, n.x - n.data.rong / 2);
      maxX = Math.max(maxX, n.x + n.data.rong / 2 + (cheDoSua ? CHO_THEM_VO : 0));
      maxY = Math.max(maxY, n.y);
    }
    const le = 32;
    const leTren = cheDoSua ? 72 : le;
    return {
      nut: ds,
      rong: maxX - minX + le * 2,
      cao: maxY + CAO_O + leTren + le + (cheDoSua ? 40 : 0),
      leX: -minX + le,
      leY: leTren,
    };
  }, [ci, gocId, soDoi, cachDoc, cheDoSua]);

  useEffect(() => {
    onKichThuoc?.(rong);
  }, [rong, onKichThuoc]);

  return (
    <div className="overflow-auto rounded-2xl bg-white ring-1 ring-stone-200 toi:bg-stone-900 toi:ring-stone-800">
      <svg
        width={rong * phongTo}
        height={cao * phongTo}
        viewBox={`0 0 ${rong} ${cao}`}
        className="block"
        role="img"
        aria-label="Sơ đồ cây gia phả"
      >
        <g transform={`translate(${leX}, ${leY})`}>
          {/* Đường nối cha mẹ với con */}
          {nut.map((n) =>
            n.children?.map((c) => {
              const y1 = n.y + CAO_O;
              const y2 = c.y;
              const giua = y1 + (y2 - y1) / 2;
              return (
                <path
                  key={`${n.data.id}-${c.data.id}`}
                  d={`M ${n.x} ${y1} V ${giua} H ${c.x} V ${y2}`}
                  fill="none"
                  className="stroke-stone-300 toi:stroke-stone-700"
                  strokeWidth={1.5}
                />
              );
            }),
          )}

          {nut.map((n) => {
            const soBanDoi = n.data.banDoi.length;
            const canhNhau: Array<{ nguoi: Person; nhan?: string }> = [
              { nguoi: n.data.nguoi },
              ...n.data.banDoi.map((bd, i) => ({
                nguoi: bd.nguoi,
                nhan: nhanBanDoi(bd.nguoi, i, soBanDoi),
              })),
            ];
            const tongRong = n.data.rong;
            const batDau = n.x - tongRong / 2;
            const laGocCay = n.depth === 0;

            return (
              <g key={n.data.id}>
                {/* Vạch nối vợ chồng */}
                {canhNhau.length > 1 && (
                  <line
                    x1={batDau + RONG_O}
                    y1={n.y + CAO_O / 2}
                    x2={batDau + tongRong - RONG_O}
                    y2={n.y + CAO_O / 2}
                    className="stroke-rose-300 toi:stroke-rose-800"
                    strokeWidth={2}
                  />
                )}

                {canhNhau.map((muc, i) => {
                  const p = muc.nguoi;
                  const x = batDau + i * (RONG_O + CACH_NGANG);
                  const laGoc = p.id === gocId;
                  return (
                    <g key={p.id}>
                      <g
                        transform={`translate(${x}, ${n.y})`}
                        className="cursor-pointer"
                        onClick={() =>
                          cheDoSua ? onSua?.(p.id) : dieuHuong(`/nguoi/${p.id}`)
                        }
                      >
                        <rect
                          width={RONG_O}
                          height={CAO_O}
                          rx={10}
                          className={
                            laGoc
                              ? 'fill-amber-100 stroke-amber-700 toi:fill-amber-950 toi:stroke-amber-600'
                              : muc.nhan
                                ? 'fill-rose-50 stroke-rose-200 toi:fill-stone-800 toi:stroke-rose-900'
                                : 'fill-stone-50 stroke-stone-300 toi:fill-stone-800 toi:stroke-stone-700'
                          }
                          strokeWidth={laGoc ? 2 : 1}
                        />
                        <text
                          x={RONG_O / 2}
                          y={23}
                          textAnchor="middle"
                          className="fill-stone-900 text-[13px] font-medium toi:fill-stone-100"
                        >
                          {p.hoTen.length > 20 ? `${p.hoTen.slice(0, 19)}…` : p.hoTen || '(chưa đặt tên)'}
                        </text>
                        <text
                          x={RONG_O / 2}
                          y={40}
                          textAnchor="middle"
                          className="fill-stone-500 text-[11px] toi:fill-stone-400"
                        >
                          {khoangNam(p) || (daMat(p) ? 'đã mất' : 'còn sống')}
                        </text>
                        {muc.nhan && (
                          <text
                            x={RONG_O - 8}
                            y={13}
                            textAnchor="end"
                            className="fill-rose-500 text-[10px] toi:fill-rose-400"
                          >
                            {muc.nhan}
                          </text>
                        )}
                      </g>

                      {cheDoSua && onThemCon && (
                        <NutSvg
                          x={x + RONG_O / 2 - 29}
                          y={n.y + CAO_O + 8}
                          rong={58}
                          nhan="+ con"
                          onClick={() => onThemCon(p.id)}
                        />
                      )}
                    </g>
                  );
                })}

                {cheDoSua && onThemBanDoi && (
                  <NutSvg
                    x={batDau + tongRong + 8}
                    y={n.y + CAO_O / 2 - 12}
                    rong={64}
                    nhan={n.data.nguoi.gioiTinh === 'nu' ? '+ chồng' : '+ vợ'}
                    mau="rose"
                    onClick={() => onThemBanDoi(n.data.id)}
                  />
                )}

                {cheDoSua && laGocCay && onThemChaMe && (
                  <NutSvg
                    x={n.x - 44}
                    y={n.y - 36}
                    rong={88}
                    nhan="+ cha mẹ"
                    mau="stone"
                    onClick={() => onThemChaMe(n.data.id)}
                  />
                )}

                {/* Còn con chưa hiển thị */}
                {n.data.conAn > 0 && (
                  <NutSvg
                    x={n.x - 46}
                    y={n.y + CAO_O + (cheDoSua ? 38 : 8)}
                    rong={92}
                    nhan={`+${n.data.conAn} người con`}
                    onClick={() => onChonGoc(n.data.id)}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
