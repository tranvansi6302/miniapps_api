# 🛡️ Quy trình kiểm duyệt Mini-App (Mini-App Moderation SOP)

> Bắt buộc theo App Store Guideline **4.7**: host (HomeBooking) **chịu trách nhiệm** mọi mini-app, phải **tự duyệt trước khi publish** và **gỡ được** nội dung vi phạm.
> Tài liệu này = quy trình team tuân theo + bằng chứng đưa Apple khi review.
> Liên quan: [`APP-STORE-CHECKLIST.md`](APP-STORE-CHECKLIST.md) §2 · [`APP-REVIEW-NOTES.md`](APP-REVIEW-NOTES.md).

---

## 1. Nguyên tắc

- Mini-app là **web HTML5** do **chúng tôi tạo/đối tác cung cấp**, **KHÔNG** phải app store mở cho bên thứ 3 tự đăng.
- **Không mini-app nào hiển thị cho user nếu chưa được duyệt** và bật `is_actived = true`.
- Mọi mini-app phải tuân **App Store Review Guidelines** + pháp luật VN.
- Host phải **gỡ tức thì** được mini-app vi phạm (kill switch), không cần update app.

---

## 2. Công tắc kỹ thuật (đã có trong hệ thống)

Mỗi mini-app từ `GET /mini-apps` có các cờ điều khiển (entity [`mini_app_remote_entity.dart`](../packages/module_api/lib/src/domain/entities/mini_app_remote_entity.dart)):

| Cờ | Ý nghĩa | Ai chỉnh |
|---|---|---|
| `is_actived` | Bật/tắt mini-app (**kill switch**). `false` → biến mất khỏi app ngay lần fetch sau | Admin |
| `is_hidden` | Ẩn khỏi danh sách (vẫn còn data) | Admin |
| `requires_auth` | Bắt đăng nhập mới mở | Admin |
| `permissions` | Quyền bridge được cấp (`camera`/`location`/`storage`) | Admin (theo kết quả duyệt) |
| `version` + `file_path` | Pin đúng bản bundle đã duyệt (đổi version = phải duyệt lại) | Admin |

> App đã lọc `where(isActive && !isHidden)` ([mini_app_list_bloc.dart](../packages/module_miniapp/lib/src/application/bloc/mini_app_list_bloc.dart#L63)) → tắt cờ là gỡ ngay.
> Bridge chỉ tiêm cho domain trong `allowedDomains` ([AppConfig](../packages/core/lib/src/config/app_config.dart)) — *(cần wire `MiniAppSecurityPolicy` vào WebView, xem checklist §2).*

---

## 3. Quy trình duyệt (SOP) — 5 bước

```
[1] Đăng ký  →  [2] Review  →  [3] Pin version+domain  →  [4] Bật is_actived  →  [5] Giám sát/Kill
```

**Bước 1 — Đăng ký.** Bên đưa mini-app cung cấp: tên, chủ sở hữu/đầu mối, mục đích, domain host, danh sách `permissions` cần, **có thu tiền không** (loại gì), privacy policy (nếu thu thập dữ liệu).

**Bước 2 — Review nội dung.** Người duyệt chạy **Checklist §4**. Đạt → ký duyệt (ghi tên + ngày). Không đạt → trả lại kèm lý do.

**Bước 3 — Pin version + domain.** Chỉ nhận `file_path`/`url` thuộc **`allowedDomains`** + **HTTPS**. Ghi lại `version` đã duyệt. *(Khi backend hỗ trợ: lưu `sha256` của bundle để verify — xem checklist §2.)*

**Bước 4 — Bật.** **Chỉ Admin** được set `is_actived = true`. Ghi **audit log**: ai bật, khi nào, mini-app + version nào.

**Bước 5 — Giám sát & Kill switch.** Định kỳ rà mini-app đang active. Phát hiện vi phạm/khiếu nại → set `is_actived = false` **ngay** (gỡ tức thì). Ghi log sự cố.

---

## 4. Checklist duyệt 1 mini-app (lưu lại mỗi lần — làm bằng chứng)

> Lưu bản đã tick cho **mỗi mini-app + mỗi version** (vd file/issue nội bộ).

- [ ] **Nội dung hợp pháp** — không 18+, cờ bạc, lừa đảo, bạo lực, vi phạm bản quyền (Guideline 1.1, 1.4, 5.x).
- [ ] **Thanh toán** — chỉ **dịch vụ/hàng vật lý**? Nếu bán **nội dung số / xu / gói premium / unlock** → **BẮT BUỘC IAP** (3.1.1). *(Xem phân loại ở checklist §3.)*
- [ ] **Quyền tối thiểu** — `permissions` xin đúng nhu cầu thật, có lý do; không xin thừa.
- [ ] **Domain & HTTPS** — host nằm trong `allowedDomains`, tất cả request là HTTPS (ATS đã siết).
- [ ] **Privacy** — nếu thu thập dữ liệu cá nhân → có privacy policy; khai đúng nhãn dữ liệu.
- [ ] **Không lạm dụng bridge** — không cố mở rộng/đổi hành vi native ngoài các method được cấp; không thu thập token để dùng sai.
- [ ] **Ổn định** — load được, không trang trắng/"đang phát triển" (tránh 4.2).
- [ ] **Age rating** phù hợp nội dung.

**Người duyệt:** `«tên»` — **Ngày:** `«dd/mm/yyyy»` — **Version:** `«…»` — **Kết luận:** ✅ Duyệt / ❌ Từ chối (lý do: …).

---

## 5. Phân quyền (ai được làm gì)

| Vai trò | Quyền |
|---|---|
| Reviewer | Chạy checklist, ký duyệt/từ chối |
| Admin | Bật/tắt `is_actived`, `is_hidden`, set `permissions`, pin version |
| Dev/đối tác mini-app | Submit bundle, sửa theo phản hồi |

> Tách Reviewer ≠ người submit để tránh tự duyệt bài mình.

---

## 6. Bằng chứng đưa Apple (khi review)

Nêu trong [App Review Notes](APP-REVIEW-NOTES.md) §2 và sẵn sàng trình bày thêm:
- Mọi mini-app **do chúng tôi tạo & kiểm duyệt nội bộ** trước khi publish (quy trình này).
- Có **kill switch** (`is_actived`) gỡ nội dung tức thì, không cần update app.
- Mini-app là **web HTML5** chạy trong **WebView sandbox**, chỉ truy cập tập năng lực native cố định qua bridge **đóng băng trong app**, **giới hạn theo `permissions` từng app**.
- Bridge chỉ inject cho **domain tin cậy** (`allowedDomains`).

---

## 7. Việc kỹ thuật còn lại để siết chặt (tham chiếu checklist §2)

- [ ] Wire `MiniAppSecurityPolicy.shouldInjectBridge()` vào WebView đang dùng (chỉ inject bridge cho `allowedDomains`).
- [ ] Verify `sha256` bundle (cần backend trả field hash).
- [ ] *(tuỳ chọn)* Gate `getUserInfo` sau scope khi backend sẵn sàng.

> Các mục này **bổ trợ** quy trình; bản thân quy trình + kill switch đã đáp ứng yêu cầu trách nhiệm host của 4.7.

---

## 8. Nhật ký kiểm duyệt (Audit Log & Moderation History)

Hệ thống tự động ghi nhật ký kiểm duyệt vào cơ sở dữ liệu (`mini_app_moderation_logs`) để làm bằng chứng bảo mật đối với Apple và đối tác vận hành.

### 8.1. Các thao tác ghi nhận lịch sử kiểm duyệt (Triggers)

Lịch sử kiểm duyệt được ghi lại ngay lập tức khi xảy ra các thao tác sau:

1. **Duyệt bản build (`APPROVE_BUILD`)**:
   - **Thời điểm**: Khi Admin chọn một bản build ở trạng thái "Chờ duyệt", hoàn tất tích kiểm tra toàn bộ checklist an toàn và click **Ký Duyệt & Phát Hành**.
   - **Dữ liệu lưu**:
     - Chi tiết từng câu trả lời trong Checklist SOP §4 (Đạt/Không đạt).
     - Ghi chú duyệt của người kiểm tra (tùy chọn).
     - Phiên bản Mini App được kích hoạt tương ứng.
2. **Từ chối bản build (`REJECT_BUILD`)**:
   - **Thời điểm**: Khi Admin chọn từ chối bản build và điền đầy đủ lý do tại form từ chối.
   - **Dữ liệu lưu**:
     - Lý do từ chối cụ thể.
     - Trạng thái checklist tại thời điểm đánh giá.
3. **Thay đổi trạng thái hoạt động / Kill Switch (`TOGGLE_ACTIVE`)**:
   - **Thời điểm**: Khi Admin nhấn nút **Xóa Mini App** (chuyển sang không hoạt động) hoặc nút **Kích hoạt** tại vùng nguy hiểm trong trang cấu hình Mini App.
   - **Dữ liệu lưu**: Trạng thái kích hoạt mới của Mini App (`is_actived = true/false`) kèm theo ghi chú hành động.

### 8.2. Cấu trúc dữ liệu ghi nhật ký (Audit Log Schema)

Mỗi bản ghi nhật ký chứa các thông tin cụ thể:

* **Thời gian thực hiện (`created_at`)**: Ngày và giờ thao tác được thực hiện (múi giờ hệ thống).
* **Người thực hiện (`performed_by`)**: Tên tài khoản Admin/Reviewer thực hiện thao tác đó.
* **Mini App & Phiên bản (`mini_app_id`, `version`)**: Định danh Mini App và mã phiên bản chịu ảnh hưởng bởi thao tác.
* **Hành động (`action`)**: Mã hành động cụ thể (`APPROVE_BUILD`, `REJECT_BUILD`, `TOGGLE_ACTIVE`).
* **Checklist dữ liệu (`checklist`)**: Cấu trúc JSON chứa:
  - `checks`: Danh sách kết quả đánh giá (ví dụ: `legal_content: true`, `stability_check: true`).
  - `notes`: Ghi chú bổ sung khi duyệt.
  - `reason`: Lý do từ chối nếu hành động là từ chối bản build.

