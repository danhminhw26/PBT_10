# 🌤️ Weather App

Ứng dụng tìm kiếm thời tiết thực tế từ API miễn phí.

## Chức năng

✅ **Tìm kiếm thời tiết** theo tên thành phố  
✅ **Hiển thị 3 states:**

- Loading: Spinner + "Đang tải..."
- Success: Hiển thị Nhiệt độ, Độ ẩm, Mô tả thời tiết
- Error: Thông báo lỗi (thành phố không tồn tại, mất mạng)

✅ **Lưu lịch sử** tìm kiếm vào LocalStorage (5 thành phố gần nhất)  
✅ **Click lịch sử** để tìm lại

## API Sử Dụng

- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search`
- **Weather:** `https://api.open-meteo.com/v1/forecast`

Miễn phí, không cần API key

## Cách chạy

```bash
# Mở file index.html trong trình duyệt
# Hoặc dùng Live Server (VS Code extension)
```

## Cấu trúc file

```
weather_app/
├── index.html      # Giao diện
├── style.css       # CSS
├── script.js       # Logic (API + UI + App)
└── README.md       # Hướng dẫn này
```

## Code Structure

```javascript
// API Layer
weatherAPI.searchCity(cityName); // Tìm tọa độ thành phố
weatherAPI.getWeather(lat, lng); // Lấy thời tiết

// UI Layer
ui.showLoading(); // Hiện spinner
ui.displayWeather(city, weather); // Hiển thị kết quả
ui.showError(message); // Hiện lỗi

// App Controller
app.search(); // Xử lý tìm kiếm
app.addToHistory(cityName); // Lưu lịch sử
```

## Điểm nổi bật

- ✨ Xử lý 3 states (Loading/Success/Error) rõ ràng
- 📱 Responsive design
- 💾 LocalStorage để lưu lịch sử
- ⚡ Event handling: Click button + Enter key
- 🎯 Tách riêng API layer, UI layer, App logic
