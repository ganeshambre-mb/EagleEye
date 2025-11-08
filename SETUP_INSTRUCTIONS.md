# EagleEye - Complete Setup Instructions

This guide will walk you through setting up both the frontend and backend of the EagleEye application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Notion account and workspace

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Notion OAuth

#### Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the integration details:
   - **Name**: EagleEye
   - **Associated workspace**: Select your workspace
   - **Type**: Public integration
4. Under **OAuth Domain & URIs**, add:
   - **Redirect URIs**: `http://localhost:5174/connect-notion`
5. Under **Capabilities**, enable:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
6. Click **"Submit"**
7. You'll see your **OAuth client ID** and **OAuth client secret**

#### Step 2: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cp env.example .env
```

Then edit `.env` and add your Notion credentials:

```env
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The backend server will run on: `http://localhost:5000`

You should see:
```
🚀 Backend server running on http://localhost:5000
📝 Notion OAuth callback URL: http://localhost:5000/notion-oauth-callback
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

Open a new terminal and navigate to the root EagleEye directory:

```bash
cd EagleEye
# (or cd .. if you're in the backend directory)
```

### 2. Install Frontend Dependencies

If you haven't already installed dependencies:

```bash
npm install
```

### 3. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will run on: `http://localhost:5173`

---

## Testing the Notion Integration

1. Open your browser and go to `http://localhost:5173` (or `http://localhost:5174` if 5173 is taken)
2. Navigate through the app:
   - Landing Page → Click "Start Analysis"
   - Login Page → Enter credentials and click "Login"
   - Connect to Notion Page → Click "Connect Notion Workspace"
3. You'll be redirected to Notion's authorization page
4. Click **"Select pages"** and authorize the integration
5. Notion redirects back to the frontend with an authorization code
6. The frontend automatically sends the code to the backend
7. The backend exchanges the code for an access token
8. You'll see a success message and automatically navigate to the Dashboard after 2 seconds

---

## Backend API Endpoints

Once the backend is running, you can test these endpoints:

### Health Check
```bash
curl http://localhost:5000/health
```

### Notion Connection Status
```bash
curl http://localhost:5000/api/notion/status
```

### Fetch Notion Pages (requires connection)
```bash
curl http://localhost:5000/api/notion/pages
```

### Disconnect Notion
```bash
curl -X POST http://localhost:5000/api/notion/disconnect
```

---

## Project Structure

```
EagleEye/
├── backend/
│   ├── server.js           # Express server with Notion OAuth
│   ├── package.json        # Backend dependencies
│   ├── .env               # Environment variables (create this)
│   ├── env.example        # Environment template
│   ├── .gitignore         # Git ignore file
│   └── README.md          # Backend documentation
├── src/
│   ├── Components/
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── ConnectToNotion.tsx  # Updated with OAuth handling
│   │   ├── CompetitiveDashboard.tsx
│   │   ├── Releases.tsx
│   │   ├── Analysis.tsx
│   │   ├── WeeklySummary.tsx
│   │   ├── Summary.tsx
│   │   └── AlltimeInsights.tsx
│   └── App.tsx
└── package.json
```

---

## Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Change PORT in .env file to a different port (e.g., 5001)
PORT=5001
```

**CORS errors:**
- Make sure both frontend and backend are running
- Check that FRONTEND_URL in `.env` matches your Vite dev server URL

**Notion OAuth errors:**
- Verify your NOTION_CLIENT_ID and NOTION_CLIENT_SECRET are correct
- Ensure redirect URI in Notion integration matches: `http://localhost:5174/connect-notion`
- Make sure both backend and frontend servers are running

### Frontend Issues

**Port 5173 already in use:**
- Vite will automatically use the next available port (5174, 5175, etc.)
- Update CORS origin in `backend/server.js` if needed

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Backend

1. Set production environment variables
2. Use a database (PostgreSQL, MongoDB) instead of in-memory Map
3. Update CORS origin to your production frontend URL
4. Update redirect URI in Notion integration
5. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name eagleeye-backend
   ```

### Frontend

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)
3. Update environment variables for production API URLs

---

## Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- Store tokens securely in production (use database, not in-memory)
- Use HTTPS in production for OAuth callbacks
- Implement rate limiting for API endpoints
- Add authentication for API endpoints in production

---

## Need Help?

- Check the backend logs for detailed error messages
- Review the Notion API documentation: [https://developers.notion.com](https://developers.notion.com)
- Ensure all dependencies are installed correctly

