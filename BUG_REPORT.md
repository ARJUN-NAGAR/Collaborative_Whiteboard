# 🐛 Bug Report & Integration Fix Guide
### Collaborative Whiteboard — Backend ↔ Frontend Merge

---

## Summary of All Bugs Found & Fixed

---

## 🔴 CRITICAL BUGS (would cause crashes / auth failure)

### 1. `AuthController.java` — Password Never Matches (Login Broken)
**File:** `controller/AuthController.java`
**Bug:** Login compared raw plaintext password directly to a BCrypt hash using `.equals()`.
BCrypt hashes are one-way — this comparison ALWAYS fails, making login impossible.
```java
// ❌ BROKEN — always returns 401
existingUser.get().getPassword().equals(user.getPassword())

// ✅ FIXED
passwordEncoder.matches(user.getPassword(), existing.get().getPassword())
```

### 2. Missing Repository Interfaces (App Would Not Start)
**Bug:** 5 repository interfaces referenced throughout services were never created.
Spring couldn't autowire them, causing startup failure.
**Created:**
- `repository/UserRepository.java`
- `repository/WhiteboardSessionRepository.java`
- `repository/ChatMessageRepository.java`
- `repository/DrawingEventRepository.java`
- `repository/WhiteboardSnapshotRepository.java`

---

## 🟠 HIGH SEVERITY BUGS (features completely non-functional)

### 3. WebSocket Topics Mismatch
**File:** `websocket/WhiteboardWebSocketController.java`
**Bug:** Backend published messages to `/topic/session/{id}` but frontend subscribed to
`/topic/board/{id}` and `/topic/chat/{id}`. No real-time events were ever received.
```java
// ❌ BROKEN
messagingTemplate.convertAndSend("/topic/session/" + message.getSessionId(), message);

// ✅ FIXED — drawing/cursor/join/leave go to:
messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);

// ✅ FIXED — chat goes to:
messagingTemplate.convertAndSend("/topic/chat/" + message.getSessionId(), message);
```

### 4. Missing WebSocket Handlers (/app/cursor, /app/join, /app/leave)
**File:** `websocket/WhiteboardWebSocketController.java`
**Bug:** Frontend sends 5 message types but backend only handled 2 (`/app/draw`, `/app/chat`).
Cursor positions, user join/leave announcements were silently dropped — no live cursors ever showed.
**Fixed:** Added `@MessageMapping` handlers for `/cursor`, `/join`, `/leave`.

### 5. API Endpoint Mismatch — Session Create
**File:** `controller/SessionController.java`
**Bug:** Frontend sends `POST /api/sessions` with a JSON body
`{ name, ownerName, ownerId }` but backend had `POST /api/sessions/create`
expecting `@RequestParam title` and `@RequestParam userId`.
Triple mismatch: wrong path + wrong HTTP body + wrong field names.
**Fixed:** `POST /api/sessions` with `@RequestBody CreateSessionRequest`.

### 6. Missing API Endpoints (Frontend Calls = 404s)
Frontend `api.js` called endpoints that didn't exist in `SessionController`:
| Frontend Call | Old Backend | Fix |
|---|---|---|
| `GET /api/sessions` | ❌ missing | ✅ added `getAll()` |
| `GET /api/sessions/active` | ❌ missing | ✅ added `getActiveSessions()` |
| `GET /api/sessions/analytics` | ❌ was `/api/analytics` | ✅ moved to `/api/sessions/analytics` |
| `PUT /api/sessions/{id}/elements` | ❌ missing | ✅ added `updateElements()` |
| `DELETE /api/sessions/{id}` | ❌ missing | ✅ added `deleteSession()` |
| `GET /api/sessions/{id}/users` | ❌ missing | ✅ added `getUsers()` |
| `PUT /api/sessions/{id}/toggle` | ❌ missing | ✅ added `toggleSession()` |

---

## 🟡 MEDIUM SEVERITY BUGS (data corruption / silent failures)

### 7. `WhiteboardSession` — Missing Fields
**File:** `model/WhiteboardSession.java`
**Bug:** Model was missing fields the frontend reads/writes.
| Missing Field | Used By |
|---|---|
| `name` | `LandingPage.jsx`, `WhiteboardApp.jsx` header, `AdminDashboard.jsx` table |
| `ownerName` | `AdminDashboard.jsx` table |
| `elementsJson` | `WhiteboardApp.jsx` canvas restore on join |

Also: field was named `isActive` — Lombok/Jackson serializes this as `"active"` in JSON
but the Spring Data `@Query` method derivation expected `findByIsActiveTrue()`.
Renamed field to `active` so everything is consistent.

### 8. `ChatMessage` — Field Name Mismatch
**File:** `model/ChatMessage.java`
**Bug:** Backend model used `userId` + `message` but frontend sends/reads
`senderId`, `senderName`, `senderColor`, `content`. Chat history would render blank.
**Fixed:** Renamed fields to match frontend exactly.

### 9. `application.properties` — Minimal Config
**Bug:** Only had `spring.application.name`. MongoDB URI, port, multipart limits all missing.
App would fail to connect to database.
**Fixed:** Added `spring.data.mongodb.uri`, `server.port`, multipart limits.

---

## FILES CHANGED

### Backend (Java)
| File | Status |
|---|---|
| `model/WhiteboardSession.java` | ✏️ Modified — added name/ownerName/elementsJson, renamed isActive→active |
| `model/ChatMessage.java` | ✏️ Modified — renamed userId→senderId, message→content, added senderName/senderColor |
| `controller/SessionController.java` | 🔄 Rewritten — all endpoints now match frontend api.js |
| `controller/AuthController.java` | ✏️ Modified — fixed passwordEncoder.matches() |
| `controller/ChatController.java` | ✏️ Minor — updated imports |
| `controller/AnalyticsController.java` | ✏️ Modified — delegates to SessionService |
| `service/SessionService.java` | ✏️ Extended — 7 new methods added |
| `service/ChatService.java` | ✏️ Minor — field name update |
| `websocket/WhiteboardWebSocketController.java` | 🔄 Rewritten — fixed topics, added 3 handlers |
| `repository/UserRepository.java` | 🆕 Created |
| `repository/WhiteboardSessionRepository.java` | 🆕 Created |
| `repository/ChatMessageRepository.java` | 🆕 Created |
| `repository/DrawingEventRepository.java` | 🆕 Created |
| `repository/WhiteboardSnapshotRepository.java` | 🆕 Created |
| `dto/CreateSessionRequest.java` | 🆕 Created |
| `dto/UpdateElementsRequest.java` | 🆕 Created |
| `dto/ToggleRequest.java` | 🆕 Created |
| `resources/application.properties` | ✏️ Fixed — added MongoDB URI and config |

### Frontend (React)
| File | Status |
|---|---|
| `services/api.js` | ✏️ Fixed — analytics URL corrected |
| `hooks/useWebSocket.js` | ✏️ Fixed — sendChat now includes senderName/senderColor in data payload |

---

## HOW TO RUN

### Prerequisites
- Java 17+, Maven
- MongoDB running on `localhost:27017`
- Node 18+

### Backend
```bash
cd backend
mvn spring-boot:run
# Starts on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
# Vite proxy forwards /api and /ws to :8080
```
