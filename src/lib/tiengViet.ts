/** Tiện ích xử lý tiếng Việt: bỏ dấu, so khớp tìm kiếm, viết hoa. */

/** Bỏ dấu và chuyển thường: "Nguyễn Văn Á" -> "nguyen van a" */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Chuẩn hoá chuỗi để tìm kiếm: bỏ dấu + gộp khoảng trắng. */
export function chuanHoa(s: string): string {
  return boDau(s).replace(/\s+/g, ' ');
}
