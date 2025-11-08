# Notion OAuth Setup Checklist

## Error: "Failed to exchange code for access token"

This error means the backend received the code but Notion rejected the token exchange. Follow this checklist:

---

## ✅ Step 1: Check Backend Logs

**Look at your backend terminal for detailed error information:**

You should see something like:
```
📥 Received token exchange request
🔄 Exchanging code with Notion API...
Configuration: { redirectUri: '...', clientId: '...', clientSecret: 'SET' }
❌ Error exchanging Notion code for token
Error details: { status: 401, data: {...} }
```

**Common error statuses:**
- **401 Unauthorized** → Invalid Client ID or Secret
- **400 Bad Request with "invalid_grant"** → Redirect URI mismatch or code already used
- **404 Not Found** → Wrong Notion API endpoint (unlikely)

---

## ✅ Step 2: Verify Environment Variables

**Check your `backend/.env` file:**

```env
NOTION_CLIENT_ID=2a4d872b-594c-8020-a0d2-0037270035f7
NOTION_CLIENT_SECRET=your_actual_secret_here
PORT=5000
```

**Important:**
- ✅ Client ID should be exactly as shown (UUID format with hyphens)
- ✅ Client Secret is a long string (starts with `secret_`)
- ✅ No extra spaces, quotes, or newlines
- ✅ File must be named `.env` (not `env.txt` or `.env.example`)

**To verify in backend terminal:**
```bash
cd backend
cat .env  # On Mac/Linux
type .env  # On Windows
```

---

## ✅ Step 3: Verify Notion Integration Settings

**Go to your Notion integration page:**

1. Visit: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click on your "EagleEye" integration
3. Check these settings:

### **OAuth Domain & URIs:**
Must have EXACTLY:
```
http://localhost:5174/connect-notion
```

**Common mistakes:**
- ❌ `http://localhost:5000/notion-oauth-callback` (wrong - this was old config)
- ❌ `https://localhost:5174/connect-notion` (wrong - should be `http`, not `https`)
- ❌ `http://localhost:5173/connect-notion` (wrong port)
- ❌ Trailing slash: `http://localhost:5174/connect-notion/`

### **Check if Client ID matches:**
The Client ID shown in Notion integration settings must match what's in your `.env` file.

### **Get the Client Secret:**
1. If you don't have the secret, click "Show" next to "OAuth client secret"
2. Copy it EXACTLY (it's a long string)
3. Paste it into your `.env` file
4. Restart the backend server

---

## ✅ Step 4: Match Frontend Configuration

**Check `src/Components/ConnectToNotion.tsx` line ~87:**

```typescript
const redirectUri = encodeURIComponent("http://localhost:5174/connect-notion");
```

This MUST match what's in:
1. Your Notion integration settings
2. The `redirect_uri` in `backend/server.js` (line ~45)

**All three must be IDENTICAL:**
- Notion Integration: `http://localhost:5174/connect-notion`
- Frontend code: `http://localhost:5174/connect-notion`
- Backend code: `http://localhost:5174/connect-notion`

---

## ✅ Step 5: Check Your Frontend Port

**Look at your frontend terminal:**

```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
```

**If it says port 5173 instead of 5174:**

You need to update the redirect URI in THREE places:

1. **Notion Integration Settings** → Change to `http://localhost:5173/connect-notion`
2. **Frontend `ConnectToNotion.tsx`** → Change to `http://localhost:5173/connect-notion`
3. **Backend `server.js`** → Change to `http://localhost:5173/connect-notion`

Then restart both servers.

---

## ✅ Step 6: Authorization Code is Single-Use

**OAuth codes can only be used ONCE.**

If you've already tried connecting and it failed, the code is now invalid. You need to:

1. Go back to the ConnectToNotion page
2. Click "Connect Notion Workspace" again
3. Authorize again (this generates a new code)
4. The new code will work (if config is correct)

**Don't refresh or go back** - each attempt uses up the code.

---

## ✅ Step 7: Restart Backend After .env Changes

**If you changed the `.env` file, you MUST restart the backend:**

1. In backend terminal, press `Ctrl+C`
2. Run `npm run dev` again
3. Verify it logs: `🚀 Backend server running on http://localhost:5000`

Environment variables are only loaded when the server starts!

---

## ✅ Step 8: Test with Fresh Authorization

**Complete flow test:**

1. ✅ Backend is running (`npm run dev` in backend directory)
2. ✅ Frontend is running (`npm run dev` in root directory)
3. ✅ `.env` file has correct Client ID and Secret
4. ✅ Notion integration has correct redirect URI
5. ✅ Both backend and frontend redirect URIs match Notion

**Now test:**

1. Navigate to ConnectToNotion page
2. Click "Connect Notion Workspace"
3. Authorize in Notion
4. Check browser console (F12)
5. Check backend terminal logs

---

## 📋 Quick Verification Commands

**1. Check if backend .env file exists:**
```bash
cd backend
ls -la .env  # Mac/Linux
dir .env     # Windows
```

**2. Test backend is responding:**
```bash
curl http://localhost:5000/health
```

Should return: `{"status":"ok","message":"Server is running"}`

**3. Check environment variables are loaded:**

Add this temporarily to `backend/server.js` after `dotenv.config()`:
```javascript
console.log('Loaded env vars:', {
  clientId: process.env.NOTION_CLIENT_ID ? 'SET' : 'MISSING',
  clientSecret: process.env.NOTION_CLIENT_SECRET ? 'SET' : 'MISSING'
});
```

---

## 🔍 Expected Backend Logs (Success)

When everything works, you should see:

```
📥 Received token exchange request
🔄 Exchanging code with Notion API...
Configuration: {
  redirectUri: 'http://localhost:5174/connect-notion',
  clientId: '2a4d872b-5...',
  clientSecret: 'SET'
}
✅ Successfully connected to Notion workspace: abc123...
```

---

## 🚨 Common Mistakes Summary

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Wrong Client ID/Secret in `.env` |
| invalid_grant | Redirect URI mismatch or code already used |
| Code already used | Get fresh code by re-authorizing |
| .env not loaded | Restart backend server |
| Port mismatch | Update all 3 places to same port |
| Missing .env | Create file from env.example |

---

## 📞 Still Not Working?

**Share these logs for help:**

1. Backend terminal output (the error details)
2. Browser console logs (F12 → Console)
3. Your frontend port (from Vite output)
4. Confirmation that Client ID/Secret are set in `.env`

The error details will show exactly what Notion returned!

