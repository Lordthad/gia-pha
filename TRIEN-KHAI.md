# Đưa gia phả lên mạng

Phần mềm dùng **hai mã tách bạch**, do bạn đặt và đổi lúc nào cũng được:

| | Ai giữ | Dùng để | Chặn được gì |
|---|---|---|---|
| **Mã xem** | Cả họ, dùng chung | Mở website xem gia phả | File dữ liệu được mã hoá — người ngoài tải về cũng không đọc nổi |
| **Mã quản trị** | Một hai người lo việc họ | Vào mục Quản trị, mở khoá mã truy cập GitHub | Không có mã này thì không đổi được thứ cả họ nhìn thấy |

Người trong họ **không phải lập tài khoản, không cần email, không cần Gmail** — chỉ cần nhớ một mã.

Đặt cả hai ở **Quản trị → Bảo mật**.

---

## Bước 1 — Đặt hai mã trước khi đưa lên mạng

Làm bước này **trước** lần đưa lên mạng đầu tiên. Nếu lỡ đẩy lên bản chưa mã hoá thì bản đó nằm
lại trong lịch sử kho GitHub, xoá đi cũng không sạch.

1. **Quản trị → Bảo mật → Mã xem**: đặt mã cho cả họ. Nên là một câu dễ nhớ khó đoán, ví dụ
   `cay-da-dau-lang-1954`. Phần mềm chấm độ mạnh và chặn mã quá ngắn, vì file mã hoá nằm công khai
   nên có thể bị dò ngoại tuyến.
2. **Mã quản trị**: đặt mã riêng, chỉ bạn và người phụ trách biết.

> Mã xem không lấy lại được. Quên là mất luôn bản đã mã hoá — hãy giữ riêng một bản `giapha.json`
> chưa mã hoá ở nơi kín đáo.

---

## Bước 2 — Đưa mã nguồn lên GitHub

Tạo kho trống trên `github.com` (nút **New repository**, không tích thêm gì), rồi tại thư mục
dự án chạy:

```bash
git init -b main
```

```bash
git add . && git commit -m "Phần mềm gia phả dòng họ"
```

```bash
git remote add origin https://github.com/TEN-TAI-KHOAN/gia-pha.git
```

```bash
git push -u origin main
```

Kho để Public hay Private đều được, vì dữ liệu đã mã hoá bằng mã xem. Để Private thì kín hơn một
lớp nữa.

---

## Bước 3 — Dựng website

Chọn một trong hai, đều miễn phí:

**Cloudflare Pages** — `dash.cloudflare.com` → Workers & Pages → Create → Pages → Connect to Git →
chọn kho. Khai báo:

| Mục | Điền |
|---|---|
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |

**GitHub Pages** — Settings của kho → Pages → Build and deployment → Source: GitHub Actions → chọn
mẫu cho Vite.

Phiên bản Node đã ghi sẵn trong `.node-version`, file `public/_headers` đã đặt sẵn các HTTP header
cần thiết (quan trọng nhất là không cho nhớ đệm file dữ liệu, nếu không thì cập nhật xong cả họ vẫn
thấy bản cũ). Không phải khai thêm gì.

Xong bước này bạn có địa chỉ dạng `gia-pha.pages.dev`. Gửi địa chỉ đó **và mã xem** cho cả họ.

---

## Bước 4 — Cho người ở xa tự nhập liệu

Khai báo một lần trên máy của người đó, tại **Quản trị → Xuất / Nhập → Đưa thẳng lên GitHub**:

1. Tạo mã truy cập: `github.com` → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
2. Repository access: **Only select repositories**, chọn đúng kho gia phả.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Đặt hạn dùng, bấm Generate, chép mã dán vào ô **Mã truy cập GitHub**.
5. Bấm **Cất mã, khoá bằng mã quản trị**, rồi điền tên chủ kho, tên kho và bấm **Thử kết nối**.

Từ đó về sau, người đó chỉ cần: mở website → nhập mã xem → nhập mã quản trị → nhập liệu → bấm
**Đưa lên mạng ngay**. Phần mềm tự mã hoá bằng mã xem rồi gửi dữ liệu và ảnh mới lên kho; website
cập nhật sau khoảng 1–2 phút.

**Mã truy cập được cất trong máy dưới dạng đã mã hoá bằng mã quản trị.** Người khác ngồi đúng máy
đó, không có mã quản trị thì không lấy mã truy cập ra dùng được. Đây là chỗ khoá thật của quyền
sửa. Máy dùng chung thì làm xong nên bấm **Khoá lại ngay** ở thẻ Bảo mật.

Muốn hai người cùng nhập liệu: mỗi người tạo một mã truy cập riêng. Nếu sửa trùng lúc, người bấm
sau nhận thông báo *"trên mạng đã có bản mới hơn"* — tải lại trang rồi nhập lại phần vừa sửa.

---

## Đổi mã về sau

**Đổi mã xem** (ví dụ có người rời họ, hoặc mã bị lộ): Quản trị → Bảo mật → đặt mã mới → **Đưa lên
mạng ngay**. Từ lúc website dựng lại xong, mã cũ hết tác dụng. Nhớ báo mã mới cho cả họ.

**Đổi mã quản trị**: đặt mã mới ở cùng chỗ. Phần mềm tự khoá lại mã truy cập GitHub bằng mã mới,
không phải khai báo lại từ đầu.

**Người phụ trách nghỉ**: xoá mã truy cập của họ trên `github.com` (Settings → Developer settings →
xoá token đó), rồi đổi mã quản trị.

---

## Cần chặt hơn nữa?

Mô hình một mã dùng chung có hai điểm yếu cố hữu: ai biết mã cũng vào được, và muốn cắt quyền một
người thì phải đổi mã cho cả họ.

Nếu sau này thấy cần chặn theo từng người, hướng đi là đưa web lên Cloudflare Pages rồi bật
**Cloudflare Access** (miễn phí tới 50 người): mỗi người vào bằng email của mình, nhận mã một lần
qua thư. Gỡ quyền một người chỉ là xoá email khỏi danh sách, không ảnh hưởng ai khác. Đổi lại,
người trong họ phải có email và chịu khó vào hòm thư lấy mã mỗi khi hết hạn phiên.

Hai cách không loại trừ nhau — bật Access mà vẫn giữ mã xem cũng được.
