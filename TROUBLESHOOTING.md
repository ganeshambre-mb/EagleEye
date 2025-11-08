# Troubleshooting Guide

## "Network error. Please try again." when connecting to Notion

This error occurs when the frontend cannot communicate with the backend. Follow these steps to resolve:

### Step 1: Verify Backend is Running

**Check if the backend server is running:**

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

3. You should see:
   ```
   🚀 Backend server running on http://localhost:5000
   📝 Notion OAuth callback URL: http://localhost:5000/notion-oauth-callback
   ```

4. If you see an error, check:
   - Are the dependencies installed? Run `npm install`
   - Is port 5000 already in use? Change PORT in `.env` file
   - Is the `.env` file configured? Copy from `env.example`

### Step 2: Verify Backend is Accessible

**Test the backend health endpoint:**

Open a new terminal and run:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{"status":"ok","message":"Server is running"}
```

If this fails, the backend is not running or is on a different port.

### Step 3: Check CORS Configuration

**Verify your frontend port:**

1. Look at your frontend terminal. It should show something like:
   ```
   VITE v4.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5174/
   ```

2. Note the port number (5173 or 5174).

3. Check `backend/server.js` CORS configuration:
   ```javascript
   app.use(cors({
     origin: ["http://localhost:5173", "http://localhost:5174"],
     credentials: true
   }));
   ```

4. Make sure your frontend port is included in the `origin` array.

### Step 4: Check Environment Variables

**Verify your `.env` file in the `backend` directory:**

```env
NOTION_CLIENT_ID=your_actual_client_id_here
NOTION_CLIENT_SECRET=your_actual_client_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

- Make sure `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` are set
- Make sure there are no extra spaces or quotes
- Make sure the file is named `.env` (not `.env.txt` or `env`)

### Step 5: Check Browser Console

**Open browser DevTools (F12) and check the Console tab:**

You should see logs like:
```
Exchanging code for token... ABC123
Response status: 200
```

If you see:
- `Failed to fetch` → Backend is not running
- `CORS error` → CORS configuration issue
- `404 Not Found` → Wrong backend URL or endpoint
- `500 Internal Server Error` → Backend error (check backend terminal)

### Step 6: Check Backend Terminal Logs

**When you attempt to connect, you should see in the backend terminal:**

```
📥 Received token exchange request
🔄 Exchanging code with Notion API...
✅ Successfully connected to Notion workspace: xxx
```

If you don't see these logs:
- Request is not reaching the backend
- Check firewall/antivirus blocking port 5000
- Try a different port

### Step 7: Test with cURL

**Test the backend endpoint directly:**

```bash
curl -X POST http://localhost:5000/api/notion/exchange-token \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
```

Expected response:
```json
{
  "success": false,
  "error": "Failed to exchange code for access token",
  "details": "..."
}
```

This error is expected (invalid code), but it confirms the backend is working.

### Step 8: Restart Both Servers

**Sometimes a simple restart fixes the issue:**

1. Stop both frontend and backend (Ctrl+C)
2. Start backend first:
   ```bash
   cd backend
   npm run dev
   ```
3. Then start frontend:
   ```bash
   cd ..
   npm run dev
   ```

## Common Issues

### Issue: Port 5000 already in use

**Solution:**
1. Change PORT in `backend/.env`:
   ```env
   PORT=5001
   ```
2. Update frontend URL in `ConnectToNotion.tsx`:
   ```typescript
   const response = await fetch('http://localhost:5001/api/notion/exchange-token', {
   ```

### Issue: ECONNREFUSED

**This means the backend is not running.**

Solution: Start the backend server as shown in Step 1.

### Issue: 401 Unauthorized from Notion

**This means your Notion credentials are incorrect.**

Solution:
1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Find your integration
3. Copy the correct OAuth client ID and secret
4. Update your `.env` file
5. Restart the backend server

### Issue: 400 Bad Request - Invalid redirect_uri

**This means the redirect URI doesn't match.**

Solution:
1. Go to your Notion integration settings
2. Make sure redirect URI is set to: `http://localhost:5174/connect-notion`
3. Make sure this matches the URL in `ConnectToNotion.tsx`

## Still Having Issues?

### Enable Detailed Logging

The code has been updated with detailed console logging. Check:

1. **Browser Console** (F12) for frontend logs
2. **Backend Terminal** for backend logs

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Connect Notion Workspace"
4. After redirect, look for the request to `exchange-token`
5. Check the request/response details

### Verify Everything is Correct

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 5173 or 5174
- [ ] `.env` file exists with correct values
- [ ] Notion integration redirect URI matches frontend URL
- [ ] Both servers were restarted after configuration changes
- [ ] No firewall blocking the ports
- [ ] Browser allows localhost connections

If all else fails, check the console logs for specific error messages and address those first.

