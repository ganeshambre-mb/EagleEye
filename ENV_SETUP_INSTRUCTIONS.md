# Environment Variables Setup Instructions

All sensitive credentials have been moved to environment variables. Follow these steps to set up your `.env` files.

---

## 📁 Frontend Setup (EagleEye/.env)

### 1. Create `.env` file in the frontend root directory
```bash
cd EagleEye
touch .env
```

### 2. Add the following content to `EagleEye/.env`
```env
# Notion OAuth Configuration
VITE_NOTION_CLIENT_ID=2a4d872b-594c-8020-a0d2-0037270035f7

# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Frontend URL (for OAuth redirect)
VITE_REDIRECT_URI=http://localhost:5174/connect-notion
```

---

## 🔧 Backend Setup (EagleEye/backend/.env)

### 1. Create `.env` file in the backend directory
```bash
cd EagleEye/backend
touch .env
```

### 2. Add the following content to `EagleEye/backend/.env`
```env
# Notion OAuth Configuration
NOTION_CLIENT_ID=2a4d872b-594c-8020-a0d2-0037270035f7
NOTION_CLIENT_SECRET=secret_7fl0DVAO9ocYGsScatqDooBuInMPaNEIJ6R8A23X6p2

# Server Configuration
PORT=5000

# Frontend URL (for CORS and OAuth redirect)
FRONTEND_URL=http://localhost:5174
REDIRECT_URI=http://localhost:5174/connect-notion
```

---

## ⚠️ Important Notes

### Security
- ✅ `.env` files are already in `.gitignore` - they will NOT be committed to version control
- ⚠️ **NEVER** commit `.env` files to Git
- ⚠️ **NEVER** share your `NOTION_CLIENT_SECRET` publicly

### Vite Environment Variables
- Frontend environment variables **MUST** be prefixed with `VITE_`
- Vite only exposes variables that start with `VITE_` to the client
- Without the `VITE_` prefix, variables won't be accessible in the frontend

### Variable Access
**Frontend (React components):**
```typescript
const clientId = import.meta.env.VITE_NOTION_CLIENT_ID;
const backendUrl = import.meta.env.VITE_BACKEND_URL;
```

**Backend (Node.js):**
```javascript
const clientId = process.env.NOTION_CLIENT_ID;
const clientSecret = process.env.NOTION_CLIENT_SECRET;
```

---

## 🔄 After Creating .env Files

### 1. Restart Backend Server
```bash
cd EagleEye/backend
# Stop the server (Ctrl+C)
npm run dev
```

### 2. Restart Frontend Dev Server
```bash
cd EagleEye
# Stop the server (Ctrl+C)
npm run dev
```

---

## ✅ Verify Configuration

### Check Backend
Open the backend terminal and look for:
```
🔄 Exchanging code with Notion API...
Configuration: {
  redirectUri: 'http://localhost:5174/connect-notion',
  clientId: '2a4d872b...',
  clientSecret: '***'
}
```

### Check Frontend
Open browser console (F12) when connecting to Notion:
```
🔐 Initiating Notion OAuth...
```

If you see an alert saying "Configuration error: Notion Client ID is missing", check that:
1. The `.env` file exists in the correct location
2. Variables are prefixed with `VITE_`
3. You've restarted the dev server

---

## 🎯 Files Updated

The following files now use environment variables:

**Frontend:**
- `src/Components/ConnectToNotion.tsx` - Client ID and redirect URI
- `src/context/NotionContext.tsx` - Backend URL for status check
- `src/Components/Releases.tsx` - Backend URL for sync

**Backend:**
- `server.js` - Client ID, Client Secret, and redirect URI

---

## 📝 Example .env.example Files

### Frontend (EagleEye/.env.example)
```env
# Notion OAuth Configuration
VITE_NOTION_CLIENT_ID=your_notion_client_id_here

# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Frontend URL (for OAuth redirect)
VITE_REDIRECT_URI=http://localhost:5174/connect-notion
```

### Backend (EagleEye/backend/env.example) - Already exists
```env
# Notion OAuth Configuration
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here

# Server Configuration
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 🚨 Troubleshooting

**Error: "Configuration error: Notion Client ID is missing"**
- Ensure `.env` file exists in `EagleEye/` directory
- Verify variables are prefixed with `VITE_`
- Restart the frontend dev server

**Error: "Server configuration error: Missing Notion credentials"**
- Ensure `.env` file exists in `EagleEye/backend/` directory
- Verify `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` are set
- Restart the backend server

**Changes not taking effect**
- Always restart the dev server after changing `.env` files
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for any error messages

