# Phần mềm Gia phả dòng họ

Website tra cứu gia phả chạy hoàn toàn trong trình duyệt, xem được trên cả máy tính và điện thoại.
Không cần máy chủ, không cần cơ sở dữ liệu — toàn bộ gia phả nằm trong một file
`public/data/giapha.json`.

## Tính năng

- **Tra cứu**: tìm theo tên (gõ không dấu vẫn ra), lọc theo đời, chi/nhánh, giới tính, còn sống hay
  đã mất.
- **So vai vế**: chọn hai người bất kỳ, phần mềm cho biết họ gọi nhau là gì (chú/cháu, bác/cháu,
  anh em con chú con bác, thím, chị dâu...), kèm **đường quan hệ** đi qua tổ chung để đối chiếu với
  gia phả giấy.
- **Cây gia phả**: sơ đồ SVG có phóng to/thu nhỏ và nút "Vừa khung" để xem **toàn bộ cây** trong
  một màn hình; chế độ danh sách phân cấp dễ bấm trên điện thoại; chế độ đường trực hệ từ một
  người ngược lên thuỷ tổ.
- **Nhập dữ liệu ngay trên sơ đồ**: bật một công tắc là mỗi người hiện các nút *+ con*,
  *+ vợ/chồng*, *+ cha mẹ*; bấm vào một người để sửa nhanh. Dựng cây trực quan, không phải nhớ mã
  người nào.
- **Lịch giỗ âm lịch**: quy đổi âm – dương theo thuật toán Hồ Ngọc Đức (múi giờ Việt Nam), có danh
  sách giỗ sắp tới và lịch cả năm theo tháng âm.
- **Ảnh, tư liệu, phần mộ**: ảnh chân dung, ảnh tư liệu, vị trí mộ kèm toạ độ mở thẳng Google Maps.
- **Quản trị**: thêm/sửa/xoá người và quan hệ, nhập từ CSV, kiểm tra lỗi dữ liệu, xuất ra file.
- **In / xuất PDF**: bản in thế thứ theo từng đời để đóng thành sách.

## Quy ước xưng hô

Đang dùng quy ước **miền Bắc**: anh/chị của cha mẹ đều gọi là *bác*; em trai cha là *chú*, em gái
cha là *cô*, em trai mẹ là *cậu*, em gái mẹ là *dì*.

Hai lệ họ được áp dụng và luôn nêu rõ trong phần giải thích:

- **Anh chị em họ xưng hô theo thứ bậc nhánh, không theo tuổi.** Người thuộc ngành trưởng ở vai
  anh/chị, dù ít tuổi hơn. Cách phân biệt *bác* với *chú/cô/cậu/dì* cũng lấy căn cứ này.
- **Con vợ cả luôn ở vai anh/chị của con vợ thứ**, dù sinh sau. Vì vậy khi một người có nhiều vợ,
  nhớ ghi đúng thứ tự *vợ cả, vợ hai...* và chọn đúng mẹ cho từng người con.

## Chạy trên máy

```bash
npm install
```

```bash
npm run dev
```

Mở `http://localhost:5173`. Muốn xem thử trên điện thoại cùng mạng Wi‑Fi thì mở địa chỉ
`http://<địa-chỉ-IP-máy-tính>:5173`.

## Nhập gia phả của dòng họ mình

Phần mềm giao đến tay bạn với **gia phả trống**, sẵn sàng để nhập dữ liệu thật.
Một dòng họ mẫu (Nguyễn Đình, 44 người, 6 đời) vẫn nằm ở `public/data/giapha-mau.json`; muốn xem
phần mềm chạy ra sao thì vào **Quản trị → Xuất / Nhập → Nạp dữ liệu mẫu**, xem xong bấm
**Xoá sạch để nhập lại từ đầu**.

Cách nhanh nhất để bắt đầu: vào **Cây họ**, bấm **Thêm cụ thuỷ tổ**, rồi dựng tiếp bằng các nút
ngay trên sơ đồ (xem mục dưới).

Hoặc nhập bằng biểu mẫu đầy đủ:

1. Vào mục **Quản trị** (nút bánh răng có chữ "Quản trị" ở góc trên bên phải màn hình).
2. Tab **Người** → bấm **Thêm** để nhập từng người. Với mỗi người, quan trọng nhất là:
   - **Họ và tên**, **giới tính**;
   - **Cha** và **Mẹ** — đây là thứ dựng nên cả cây gia phả;
   - **Thứ tự sinh** (con cả ghi 1, con thứ hai ghi 2...) hoặc **năm sinh**. Thiếu cả hai thì phần
     mềm không phân biệt được *bác* với *chú*, và sẽ báo "bác hoặc chú".
3. Vợ/chồng nối trong phần **Vợ / chồng** của form. Người chưa có trong gia phả thì tạo mới trước
   rồi quay lại nối. Có nhiều vợ thì đặt **thứ tự 1 cho vợ cả**, 2 cho vợ hai — thứ tự này quyết
   định vai anh/chị của các con.
4. Tab **Dòng họ**: đặt tên dòng họ, chọn **thuỷ tổ** (người này là đời 1), viết lời tựa.
5. Tab **Kiểm tra**: rà lại các lỗi phần mềm phát hiện (cha sinh sau con, vòng lặp cha–con, người
   chưa nối vào cây, nghi trùng bản ghi...).

### Nhập trực quan trên sơ đồ

Vào **Cây họ → Sơ đồ**, bật *Nhập dữ liệu ngay trên sơ đồ*.

- Gia phả còn trống thì bấm **Thêm cụ thuỷ tổ** — người này được tính là đời thứ nhất.
- **+ con** dưới mỗi người: thêm con. Người cha có nhiều vợ thì hộp thoại bắt chọn mẹ.
- **+ vợ / + chồng** bên phải: thêm bạn đời, chọn *vợ cả* hay *vợ hai*.
- **+ cha mẹ** phía trên người gốc: dựng ngược lên các đời trước; sơ đồ tự chuyển gốc lên người
  vừa thêm để tiếp tục.
- Bấm vào một người: sửa nhanh tên, giới tính, năm sinh, thứ tự; cần nhập ngày giỗ, mộ phần, ảnh
  thì bấm **Form đầy đủ**.

### Nhập hàng loạt bằng CSV

Tab **Xuất / Nhập** nhận file `.csv` với dòng đầu là tên cột:

```
id,hoTen,gioiTinh,chaId,meId,thuTu,chiNhanh,sinh,mat,gioNgay,gioThang,queQuan,ngheNghiep,congDuc,ghiChu
```

`gioiTinh` ghi `nam` hoặc `nu`. `sinh`/`mat` ghi `1943-05-12`, `1943-05`, hoặc chỉ `1943`.
Dòng nào có `id` trùng người đã có thì cập nhật đè lên người đó.

## Đưa lên mạng cho cả họ xem

Website là file tĩnh nên đưa lên GitHub Pages hay Cloudflare Pages đều được, không mất phí.

Phần mềm dùng **hai mã tách bạch**, do người quản trị đặt và đổi lúc nào cũng được:

| | Ai giữ | Dùng để | Chặn được gì |
|---|---|---|---|
| **Mã xem** | Cả họ, dùng chung | Mở website xem gia phả | Dữ liệu được mã hoá (AES-GCM 256, PBKDF2 250.000 vòng) — người ngoài tải file về cũng không đọc nổi |
| **Mã quản trị** | Một hai người | Vào mục Quản trị, mở khoá mã truy cập GitHub | Không có mã này thì không đổi được thứ cả họ nhìn thấy |

Người trong họ **không phải lập tài khoản, không cần email** — chỉ cần nhớ một mã.

Vì sao phải mã hoá chứ không chỉ dựng màn hình đăng nhập: web tĩnh không giữ được bí mật. Nếu chỉ
che bằng JavaScript thì ai cũng tải thẳng `data/giapha.json` về đọc được. Mã hoá chính file dữ liệu
mới là thứ có tác dụng thật.

**Mã truy cập GitHub được cất trong máy dưới dạng đã mã hoá bằng mã quản trị.** Người ngồi đúng máy
đó mà không có mã quản trị thì không lấy ra dùng được — đây mới là cửa khoá thật của quyền sửa.

Toàn bộ các bước cài đặt, và cách để người ở xa tự nhập liệu rồi bấm một nút là dữ liệu lên mạng,
xem ở **[TRIEN-KHAI.md](TRIEN-KHAI.md)**.

Có sẵn tờ **[HUONG-DAN-NHAP-LIEU.md](HUONG-DAN-NHAP-LIEU.md)** viết cho người nhập liệu — in ra
để cạnh máy, có chỗ điền hai mã và bảng tra khi gặp trục trặc.

### Cách thủ công: xuất file rồi tự đưa lên

Dành cho người quen dùng git.

1. **Quản trị → Xuất / Nhập → Xuất trọn bộ (.zip có ảnh)**.
2. Giải nén, chép đè `data/` và `media/` vào thư mục `public/` của mã nguồn.
3. Chạy `npm run build`, đưa thư mục `dist/` lên nơi lưu trữ website.

Trên Chrome/Edge máy tính còn có nút **Ghi thẳng vào thư mục public/** — chọn thư mục một lần,
phần mềm tự ghi, bỏ được bước giải nén.

## Kiểm thử

```bash
npm test
```

65 bài kiểm thử phủ:

- **Động cơ xưng hô**: trực hệ, anh em ruột, chú/bác/cô/cậu/dì, họ xa, ông chú/bà cô, dâu rể, thím,
  thông gia, lệ vợ cả, thứ bậc nhánh.
- **Lịch âm**: đối chiếu Tết 2023–2026, giỗ Tổ Hùng Vương, Trung thu, tháng nhuận.
- **Mã hoá**: mã hoá rồi giải mã ra đúng nội dung cũ, sai mã thì báo lỗi chứ không trả bừa, chuỗi
  đã mã hoá không còn lộ tên người.
- **Mã truy cập GitHub**: chỉ mở được bằng đúng mã quản trị, thứ nằm trong máy không lộ mã truy cập,
  đổi mã quản trị thì mã truy cập theo mã mới.

## Cấu trúc mã nguồn

```
public/data/giapha.json       Dữ liệu gia phả — file duy nhất cần sao lưu
public/data/giapha-mau.json   Dòng họ mẫu để xem thử, cũng là dữ liệu cho bộ kiểm thử
public/media/                 Ảnh chân dung, ảnh mộ, tư liệu
src/components/Logo.tsx       Biểu tượng cây gia phả (gốc, ba cành, rễ)
src/types/giapha.ts           Mô hình dữ liệu
src/lib/xungHo.ts             Động cơ tính vai vế và xưng hô
src/lib/quyUoc/mienBac.ts     Bảng từ vựng xưng hô miền Bắc
src/lib/amLich.ts             Chuyển đổi âm lịch – dương lịch
src/lib/chiMuc.ts             Dựng chỉ mục quan hệ, tính số đời
src/lib/kiemTra.ts            Rà soát lỗi dữ liệu
src/lib/luuTru.ts             Lưu bản nháp, ảnh, xuất/nhập file
src/lib/baoMat.ts             Mã hoá dữ liệu bằng mật khẩu
src/lib/github.ts             Đưa dữ liệu thẳng lên kho GitHub
.node-version                 Phiên bản Node cho máy dựng của Cloudflare
public/_headers               HTTP header cho Cloudflare Pages (GitHub Pages bỏ qua)
.github/workflows/deploy.yml  Tự kiểm thử, dựng và đưa web lên GitHub Pages
src/components/CayGiaPha.tsx  Sơ đồ cây SVG kèm các nút nhập liệu
src/pages/                    Các màn hình
```

Muốn thêm quy ước xưng hô miền Trung hoặc miền Nam thì viết thêm file trong `src/lib/quyUoc/`
theo đúng khuôn của `mienBac.ts`; thuật toán trong `xungHo.ts` không phải sửa.
