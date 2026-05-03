# TAKE ONE

Film crew platform for college filmmakers.

---

## Setup

**1. Database**
```
mysql -u root -p
CREATE DATABASE takeone;
SOURCE backend/schema.sql;
```

**2. Backend**
```
cd backend
npm install
npm run dev
```

**3. Frontend**
Open `project.html` in browser.

---

## Files

```
project.html, project.css, project.js
profile.html, profile.css, profile.js
api.js
backend/server.js, db.js
backend/routes/scripts.js, users.js
```

---

## APIs

**Scripts**
- GET /api/scripts
- GET /api/scripts/search
- POST /api/scripts

**Users**
- POST /api/users/register
- POST /api/users/login
- GET /api/users/:id
- PUT /api/users/:id

---

## Database

**users** - id, name, email, password, role, college, city

**scripts** - id, user_id, title, genre, synopsis, poster_url

---

## Test

- Backend: http://localhost:3000/api/health
- Login works
- Search works
- Upload works
