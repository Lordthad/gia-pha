/**
 * Xuất sơ đồ cây ra file SVG đứng một mình.
 *
 * Sơ đồ trên màn hình lấy màu từ bảng kiểu của website, nên chép nguyên xi ra
 * file thì mở lên chỉ thấy hình đen trắng vỡ vụn. Ở đây phải đọc màu thật mà
 * trình duyệt đang vẽ rồi ghi thẳng vào từng nét, file mới xem và in được ở
 * bất cứ đâu.
 *
 * Chọn SVG vì đây là ảnh vector: phóng to cỡ nào chữ cũng sắc, in ra khổ A3 hay
 * dán mấy tờ A4 lại đều được, mà file chỉ vài chục KB.
 */

const THUOC_TINH = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'font-size',
  'font-family',
  'font-weight',
  'text-anchor',
  'opacity',
];

/** Chuyển sơ đồ đang hiển thị thành chuỗi SVG tự chứa, không cần CSS ngoài. */
export function svgThanhChuoi(goc: SVGSVGElement): string {
  const ban = goc.cloneNode(true) as SVGSVGElement;
  const nguon: Element[] = [goc, ...Array.from(goc.querySelectorAll('*'))];
  const dich: Element[] = [ban, ...Array.from(ban.querySelectorAll('*'))];

  nguon.forEach((el, i) => {
    const d = dich[i];
    if (!d) return;
    const kieu = getComputedStyle(el);
    for (const t of THUOC_TINH) {
      const gt = kieu.getPropertyValue(t);
      // Giữ cả giá trị 'none': nét nối dùng fill=none, bỏ đi là hình bị tô đặc.
      if (gt) d.setAttribute(t, gt);
    }
    d.removeAttribute('class');
  });

  const [, , rong, cao] = (goc.getAttribute('viewBox') ?? '0 0 800 600')
    .split(/\s+/)
    .map(Number);
  ban.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  ban.setAttribute('width', String(rong));
  ban.setAttribute('height', String(cao));
  ban.removeAttribute('style');

  // Nền trắng, nếu không thì in ra trên giấy sẽ trong suốt.
  const nen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  nen.setAttribute('width', '100%');
  nen.setAttribute('height', '100%');
  nen.setAttribute('fill', '#ffffff');
  ban.insertBefore(nen, ban.firstChild);

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(ban)}`;
}

/** Tải sơ đồ về máy dưới dạng file .svg. */
export function taiSvg(goc: SVGSVGElement, tenFile: string): void {
  const blob = new Blob([svgThanhChuoi(goc)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = tenFile.endsWith('.svg') ? tenFile : `${tenFile}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tên file gọn gàng, bỏ dấu và khoảng trắng. */
export function tenFileSoDo(tenDongHo: string, rutGon: boolean): string {
  const goc = tenDongHo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const ngay = new Date().toISOString().slice(0, 10);
  return `${goc || 'gia-pha'}-so-do-${rutGon ? 'rut-gon' : 'day-du'}-${ngay}.svg`;
}
