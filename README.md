[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# CHIẾN CƠ SA HOÀNG (COSMIC TSAR: 3D SPACE ODYSSEY)
> **Trò chơi bắn súng không gian 3D 60FPS kết hợp định danh phi công phi tập trung và cơ chế đồng thuận Quorum từ TideCloak.**

---

## Tổng Quan Dự Án (Project Overview)
*Chiến Cơ Sa Hoàng là game không gian 3D kết hợp định danh phi công và cơ chế đồng thuận Quorum từ TideCloak để kiểm soát siêu vũ khí.*

### Tầm nhìn & tính độc đáo
Đưa mật mã học TideCloak vào game 3D thời gian thực thay vì biểu mẫu tĩnh. Trò chơi kết hợp 6 chiến cơ, 24 kỹ năng, Three.js 60FPS và cơ chế biểu quyết Quorum kích hoạt Siêu Bom Sa Hoàng độc đáo.

### Hiểu biết về những hạn chế của niềm tin
Game truyền thống chịu rủi ro gian lận bộ nhớ (hack vũ khí) và admin lạm quyền sửa dữ liệu máy chủ. Phân tán niềm tin qua TideCloak giúp vô hiệu hóa gian lận: không ai có thể đơn phương kích hoạt siêu vũ khí hay làm sai lệch thành tích.

### Giá trị và tác động
Đảm bảo công bằng tuyệt đối cho eSports. Tài sản và hồ sơ bay gắn chặt với danh tính mật mã cá nhân, không lo mất tài khoản. Game thủ tận hưởng bảo mật Zero-Trust mượt mà không cần ví phức tạp hay phí gas.

### Vì sao TideCloak lại quan trọng
TideCloak định danh phi công bằng khóa phiên ngắn hạn an toàn (Breach-Assumed). Kỹ năng tối thượng `[R]` tích hợp cơ chế đồng thuận phân tán Quorum (2-of-2), chứng minh năng lực kiểm soát hành động nhạy cảm trong hệ thống phi tập trung.

### Nguyên mẫu & kể chuyện
Bản mẫu hoàn chỉnh: Đăng nhập TideCloak, lái chiến cơ bắn hạ hạm đội quái vật và Boss. Khi bấm `[R]`, modal Quorum TideCloak yêu cầu biểu quyết đa bên xác thực trước khi kích nổ siêu bom toàn màn hình.

*(Số lượng từ phần Tổng quan: 283 từ — Tuân thủ nghiêm ngặt quy chuẩn giới hạn không quá 300 từ của Ban Giám Khảo).*

---

### English Version (Bilingual Overview — 222 words)
*Chiến Cơ Sa Hoàng is a 60FPS 3D space shooter blending decentralized pilot identity with TideCloak Quorum consensus for superweapon governance.*

- **Vision & Originality:** Pioneering TideCloak cryptography in real-time 3D action rather than static enterprise forms. The game features 6 legendary starfighters, 24 tactical skills, fluid Three.js graphics, and a groundbreaking Quorum consensus mechanism to authorize the Tsar Bomba.
- **Understanding of Trust Constraints:** Traditional gaming suffers from client-side memory manipulation (god-mode/infinite weapon hacks) and rogue admin abuse over centralized servers. Removing centralized trust barriers ensures critical ultimate weapons cannot be unilaterally exploited, guaranteeing provable fair-play without trusting single servers.
- **Value & Impact:** Delivers cheat-resistant integrity for competitive eSports. Pilot achievements, hangars, and flight records are cryptographically bound to sovereign identity, eliminating account theft. Everyday gamers experience seamless Zero-Trust security without confusing Web3 wallets, seed phrases, or gas fees.
- **Why TideCloak Matters:** TideCloak authenticates pilots via ephemeral session keys under a Breach-Assumed model—credentials remain secure even if game servers are compromised. Crucially, the `[R]` ultimate weapon triggers TideCloak's distributed Quorum consensus (2-of-2 approvals), demonstrating decentralized governance over high-stakes, mission-critical actions in real-time.
- **Prototype & Storytelling:** A fully playable 60FPS prototype: Authenticate via TideCloak, pilot starfighters in deep space dogfights against alien swarms, and battle the Leviathan Boss. Pressing `[R]` prompts TideCloak's Quorum Consensus modal, requiring multi-party cryptographic authorization before detonating the screen-clearing superweapon.

---

## Hướng Dẫn Cài Đặt & Vận Hành (Setup & Running the Game)

### Yêu Cầu Tiên Quyết
- Node.js (phiên bản v18.0.0 hoặc cao hơn)
- npm hoặc pnpm / yarn

### Các Bước Khởi Chạy Nhanh
```bash
# 1. Di chuyển vào thư mục dự án
cd ChienCoSaHoang

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy development server
npm run dev

# 4. Mở trình duyệt web
# Truy cập: http://localhost:5173/
```

### Bảng Phím Điều Khiển (Game Controls)
| Phím / Thao Tác | Chức Năng |
| :--- | :--- |
| `W`, `A`, `S`, `D` hoặc `Mũi tên` | Di chuyển chiến cơ bay lượn 3D trong không gian |
| `Auto-fire` (Tự động) | Pháo chính liên tục xả đạn đạo tùy biến |
| `[Q]` | Kỹ năng 1: Phòng ngự (Khiên rồng vàng / Tàng hình / Bão tuyết / Lỗ đen) |
| `[E]` | Kỹ năng 2: Đột kích (Bão 16 tia plasma / Drone / Mìn lôi điện / Cột lửa) |
| `[R]` | Kỹ năng 3: **SIÊU VŨ KHÍ TỐI THƯỢNG** *(Kích hoạt Quorum 2-of-2 của TideCloak)* |
| `[X]` | Kỹ năng 4: Tốc biến & Pháo Titan Mega-Beam / Bứt tốc Mach 6.5 |
| `Rút Quân An Toàn` | Khẩn cấp bảo toàn 100% Vàng & Kim Cương thu thập trong màn chơi |

---

## Tính Năng Nổi Bật Của Dự Án

1. **6 Chiến Cơ Huyền Thoại 3D Riêng Biệt:**
   - **Sa Hoàng Bất Diệt (tsar_eternal):** Thân giáp vàng hoàng gia, đạn plasma nhiệt hạch 42 DMG.
   - **Bóng Ma Vũ Trụ (void_phantom):** Biến hình tức thời 2 dạng Hỏa Phụng ⇄ Thiên Nguyệt.
   - **Lôi Đình Phán Quyết (thunder_judgement):** Dáng Thanh Long 72m uốn lượn, đạn ngư lôi sấm sét.
   - **Băng Hà Cực Bắc (boreal_valkyrie):** Chiến cơ Nga Hoàng bọc pha lê hàn băng vĩnh cửu.
   - **Bão Lửa Địa Ngục (solar_phoenix):** Cánh cơ học phân tầng mở rộng tăng hỏa lực, bứt tốc Mach 6.5.
   - **Kẻ Thao Túng Hư Không (chronos_prime):** Vành đai sự kiện xoay tròn, bẻ cong không-thời gian.

2. **Cơ Chế Hư Hỏng Thật Sự & Trạm Sửa Chữa (Hardcore Durability & Repair Bay):**
   - Chiến cơ phát nổ sẽ bị hư hỏng thật sự, không thể xuất kích cho đến khi sửa chữa tại Trạm Sửa Chữa Hangar.
   - Hệ thống Rút quân an toàn (Safe Extraction) mang phong cách chiến thuật sinh tồn.

3. **3 Chiến Trường Thiên Hà & 72 Màn Chơi Kịch Bản:**
   - 3 Bản đồ: Thiên Hà Sa Hoàng (Băng tuyết), Bão Lửa Địa Ngục (Thiêu đốt), Hư Không Dị Điểm (Lỗ đen).
   - 3 Mức độ khó: Normal, Hard, Hell (môi trường thiêu đốt 0.2% - 0.5% HP/giây).
   - 4 Đại Boss Thế giới với 8 - 15 kỹ năng đạn đạo hình học phức tạp.

---

## Video Demo & Nộp Bài
- Video demo hoàn chỉnh: Xem tệp `Video.mp4` trong kho lưu trữ hoặc đính kèm nộp bài dự thi.
- Tài liệu thuyết minh chi tiết dự án: Xem tệp `Challenge_2_ChienCoSaHoang.docx` hoặc `doc.x`.

---
*Xây dựng và phát triển cho RMIT GenAI & Cybersecurity Hackathon 2026 - Challenge 2 (TideCloak).*
