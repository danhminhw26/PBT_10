# PHIẾU BÀI TẬP 10 - ASYNC JAVASCRIPT & API INTEGRATION

## Câu Trả Lời

---

## PHẦN A — KIỂM TRA ĐỌC HIỂU (15 điểm)

### Câu A1 (5đ) — Sync vs Async

**Thứ tự output:**

```
1 - Start
4 - End
3 - Promise
6 - Promise 2
2 - Timeout 0ms
7 - Nested timeout
5 - Timeout 100ms
```

**Giải thích:**

**Event Loop, Microtask Queue, Macrotask Queue:**

1. **Call Stack** thực thi mã đồng bộ đầu tiên:
   - In "1 - Start"
   - In "4 - End"

2. **Macrotask Queue** nhận: `setTimeout(..., 0)` và `setTimeout(..., 100)`

3. **Microtask Queue** nhận:
   - `Promise.resolve().then()` → in "3 - Promise"
   - `Promise.resolve().then()` (Promise 2) → in "6 - Promise 2"

**Event Loop hoạt động:**

- Call Stack rỗng → Check Microtask Queue
- Microtask Queue được xử lý **trước khi** Macrotask Queue
- Tất cả Microtask được xử lý xong → Quay lại Macrotask
- `setTimeout(..., 0)` thực thi → in "2 - Timeout 0ms"
- **Nested setTimeout** bên trong Promise 2 được thêm vào Macrotask → in "7 - Nested timeout"
- `setTimeout(..., 100)` thực thi sau 100ms → in "5 - Timeout 100ms"

---

### Câu A2 (5đ) — Fetch API

```javascript
async function getData() {
  try {
    const response = await fetch("https://api.example.com/data");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed:", error.message);
    return null;
  }
}
```

**Giải thích từng dòng:**

1. **`await fetch(...)`**
   - `fetch()` trả về một **Promise**
   - Promise resolve với `Response` object (chưa là data thực)
   - `await` dừng execution cho đến khi Promise resolve
   - Nếu lỗi network (mất wifi), `fetch()` reject (bị catch)

2. **`response.ok`**
   - `ok` = `true` khi status code: **200-299** (success range)
   - `ok` = `false` khi status code **≥ 400**
   - **3 status codes false:**
     - 404 Not Found (tài nguyên không tồn tại)
     - 500 Internal Server Error (lỗi server)
     - 401 Unauthorized (không có quyền truy cập)

3. **`response.json()`**
   - Trả về **Promise<Object>** (phải parse response body từ JSON text)
   - Cần `await` lần nữa vì parsing JSON là **bất đồng bộ**
   - Nếu response không phải valid JSON → Promise reject

4. **`try...catch` bắt:**
   - Network errors: Wifi mất → `fetch()` reject
   - HTTP error (404, 500) khi throw `new Error(...)`
   - JSON parse error: Response không phải JSON hợp lệ
   - **KHÔNG bắt** 404/500 tự động → phải check `response.ok` rồi throw

---

### Câu A3 (5đ) — Promise States

**Sơ đồ 3 trạng thái Promise:**

```
         ┌─────────────────────────────────┐
         │      Pending                    │
         │  (Chờ result từ async task)    │
         └──────────┬──────────────────────┘
                    │
         ┌──────────┴──────────────┐
         │                         │
         ▼                         ▼
    Fulfilled                   Rejected
    (Thành công)               (Thất bại)
    - Có kết quả               - Có lỗi
    - Gọi .then()              - Gọi .catch()
```

**Callback Hell:**

- Khi lồng nhiều callback → code khó đọc, khó bảo trì
- Cấp độ lồng sâu: `function(cb1 { function(cb2 { function(cb3 { ... })})}`

**Ví dụ Callback Hell (4 cấp):**

```javascript
function fetchUserData(userId, callback) {
  getUser(userId, function (user) {
    console.log("User:", user.name);

    getPosts(user.id, function (posts) {
      console.log("Posts:", posts.length);

      getComments(posts[0].id, function (comments) {
        console.log("Comments:", comments.length);

        getAuthor(comments[0].authorId, function (author) {
          console.log("Author:", author.name);
          callback(author);
        });
      });
    });
  });
}
```

**Refactor với async/await:**

```javascript
async function fetchUserData(userId) {
  try {
    const user = await getUser(userId);
    console.log("User:", user.name);

    const posts = await getPosts(user.id);
    console.log("Posts:", posts.length);

    const comments = await getComments(posts[0].id);
    console.log("Comments:", comments.length);

    const author = await getAuthor(comments[0].authorId);
    console.log("Author:", author.name);

    return author;
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

**Lợi ích:**

- Code tuyến tính, dễ đọc
- Xử lý lỗi tập trung với `try...catch`
- Tránh callback hell

---

## PHẦN C — PHÂN TÍCH (20 điểm)

### Câu C1 (10đ) — Error Handling Strategy

#### 1. Network Errors (mất mạng)

```javascript
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout - network too slow");
    } else if (error instanceof TypeError) {
      throw new Error("Network error - unable to reach server");
    } else {
      throw error;
    }
  }
}
```

#### 2. API Errors (xử lý từng loại)

```javascript
async function handleAPIError(error, response) {
  if (response?.status === 404) {
    return { success: false, message: "Resource not found" };
  }

  if (response?.status === 429) {
    // Too Many Requests - Retry sau
    return {
      success: false,
      message: "Rate limited. Try again later.",
      retry: true,
    };
  }

  if (response?.status === 500) {
    // Server error
    return {
      success: false,
      message: "Server error. Try again later.",
      retry: true,
    };
  }

  if (response?.status === 401) {
    // Unauthorized
    return {
      success: false,
      message: "Unauthorized. Please login.",
      redirect: "/login",
    };
  }

  if (error.message === "Network error") {
    return { success: false, message: "No internet connection", retry: true };
  }

  return { success: false, message: "Unknown error occurred" };
}
```

#### 3. Timeout Handler

```javascript
async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${ms}ms`);
    }
    throw error;
  }
}
```

#### 4. Retry Logic (thử lại 3 lần)

```javascript
async function fetchWithRetry(url, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: ${url}`);

      const response = await fetchWithTimeout(url, 10000);
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${error.message}`,
        );
      }

      // Exponential backoff: 1s, 2s, 4s...
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${waitTime}ms...`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Sử dụng:
async function getDataSafely(url) {
  try {
    const data = await fetchWithRetry(url, 3);
    return data;
  } catch (error) {
    console.error("Fatal error:", error.message);
    return null;
  }
}
```

---

### Câu C2 (10đ) — Promise.all vs Promise.allSettled vs Promise.race vs Promise.any

| Method          | Khi nào resolve?                 | Khi nào reject?                | Use case                                                         |
| --------------- | -------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `.all()`        | Tất cả promises resolve          | **Ngay khi 1 promise reject**  | Gọi multiple APIs cần tất cả thành công. Nếu 1 lỗi, toàn bộ fail |
| `.allSettled()` | **Luôn** (sau khi tất cả settle) | **Không bao giờ** reject       | Dashboard: 1 API lỗi không ảnh hưởng widget khác                 |
| `.race()`       | Khi **promise đầu tiên** settle  | Khi promise đầu tiên reject    | Timeout race: fetch vs timeout timer                             |
| `.any()`        | Khi **promise đầu tiên** resolve | Tất cả reject (AggregateError) | Fallback: gọi API1, nếu lỗi thử API2, API3...                    |

**Ví dụ thực tế cho mỗi method:**

#### 1. Promise.all() — Tất cả phải thành công

```javascript
// E-Commerce: Lấy product info + reviews + related items cùng lúc
async function getProductPage(productId) {
  try {
    const [product, reviews, related] = await Promise.all([
      fetch(`/api/products/${productId}`).then((r) => r.json()),
      fetch(`/api/products/${productId}/reviews`).then((r) => r.json()),
      fetch(`/api/products/${productId}/related`).then((r) => r.json()),
    ]);

    // Nếu 1 trong 3 lỗi → ERROR toàn bộ
    return { product, reviews, related };
  } catch (error) {
    console.error("Failed to load product page:", error);
    // Hiện error page, không hiện partial data
  }
}
```

#### 2. Promise.allSettled() — Mỗi widget độc lập

```javascript
// Dashboard: 3 API khác nhau, 1 API lỗi không ảnh hưởng cái khác
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetch("/api/weather").then((r) => r.json()),
    fetch("/api/news").then((r) => r.json()),
    fetch("/api/stocks").then((r) => r.json()),
  ]);

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      renderWidget(index, result.value); // ✅ Success
    } else {
      renderWidgetError(index, result.reason); // ❌ Error
    }
  });
}
```

#### 3. Promise.race() — Race timeout

```javascript
// Timeout race: Nếu API chậm > 5 giây, dùng cached data
async function fetchWithTimeout(url, cacheData) {
  const fetchPromise = fetch(url).then((r) => r.json());
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000),
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.log("Using cached data due to:", error.message);
    return cacheData;
  }
}
```

#### 4. Promise.any() — Fallback APIs

```javascript
// Gọi 3 CDN khác nhau, dùng cái nào reply đầu tiên
async function loadLibrary() {
  try {
    const script = await Promise.any([
      fetch("https://cdn1.com/lib.js").then((r) => r.text()),
      fetch("https://cdn2.com/lib.js").then((r) => r.text()),
      fetch("https://cdn3.com/lib.js").then((r) => r.text()),
    ]);

    console.log("Loaded from first responding CDN");
    return script;
  } catch (errors) {
    // Tất cả 3 CDN lỗi
    console.error("All CDNs failed:", errors);
    throw new Error("Unable to load library from any CDN");
  }
}
```

---
