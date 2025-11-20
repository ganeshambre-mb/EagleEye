# Troubleshooting Guide

## Application Not Loading / "Network Error" Issues

This error occurs when the application cannot connect to external APIs or when there are configuration issues.

### Step 1: Verify Environment Configuration

**Check your `.env` file in the root directory:**

Ensure all required variables are set:

```bash
# Required variables
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_REDIRECT_URI=http://localhost:5174/connect-notion
VITE_NOTION_API_KEY=your_notion_api_key
```

### Step 2: Check Development Server

**Verify the development server is running:**

```bash
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

### Step 3: Verify Notion Integration Setup

**Test your Notion configuration:**

1. Visit https://www.notion.so/my-integrations
2. Verify your integration exists and is active
3. Check that OAuth redirect URIs include `http://localhost:5174/connect-notion`
4. Ensure your API key is valid and not expired

### Step 4: Check Browser Console

**Open browser developer tools (F12) and check for errors:**

Common error patterns:
- `Failed to fetch` → Network connectivity issue
- `CORS error` → Notion API configuration issue
- `401 Unauthorized` → Invalid API credentials
- `404 Not Found` → Wrong API endpoint or configuration

### Step 5: Clear Application Data

**Reset application state:**

1. Open browser developer tools (F12)
2. Go to Application tab → Storage
3. Clear Local Storage for `localhost:5174`
4. Refresh the page

### Step 6: Common Error Messages

**Error Message Meanings:**

- `Configuration error: Notion Client ID is missing` → Check `VITE_NOTION_CLIENT_ID` in `.env`
- `Network error: Cannot connect` → Check internet connection and Notion API status
- `Invalid JSON response` → API endpoint returning unexpected data
- `OAuth error` → Notion OAuth configuration issue

### Step 7: Verify Dependencies

**Ensure all dependencies are installed:**

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Or if using yarn
rm -rf node_modules yarn.lock
yarn install
```

### Step 8: Check for Port Conflicts

**If port 5174 is in use:**

```bash
# Kill process using port 5174
npx kill-port 5174

# Or start on different port
npm run dev -- --port 3000
```

Remember to update your Notion OAuth redirect URI if you change the port.

## Additional Resources

- [Notion API Documentation](https://developers.notion.com/)
- [React Documentation](https://react.dev/)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)

If you're still experiencing issues, check the browser console for specific error messages and ensure all environment variables are correctly configured.

