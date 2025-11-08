# EagleEye Backend Server

Backend server for handling Notion OAuth authentication and API interactions.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory by copying the example:

```bash
cp env.example .env
```

Then update the `.env` file with your Notion OAuth credentials:

```env
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=http://localhost:5000/notion-oauth-callback
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Get Notion OAuth Credentials

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Fill in the details:
   - **Name**: EagleEye
   - **Associated workspace**: Select your workspace
   - **Type**: Public integration
4. Under **OAuth Domain & URIs**, add:
   - **Redirect URIs**: `http://localhost:5174/connect-notion`
5. Under **Capabilities**, enable:
   - Read content
   - Update content
   - Insert content
6. Click "Submit"
7. Copy the **OAuth client ID** and **OAuth client secret** to your `.env` file

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Exchange OAuth Token
- **POST** `/api/notion/exchange-token`
  - Accepts authorization code from frontend
  - Exchanges code for access token with Notion API
  - Stores token and returns success/error response
  - Body: `{ "code": "oauth_code_from_notion" }`
  - Response: `{ "success": true, "workspaceId": "...", "message": "..." }`

### Notion Status
- **GET** `/api/notion/status`
  - Returns connection status
  - Response: `{ connected: boolean, workspaceId?: string, connectedAt?: string }`

### Fetch Notion Pages
- **GET** `/api/notion/pages`
  - Fetches pages from connected Notion workspace
  - Requires active Notion connection

### Disconnect Notion
- **POST** `/api/notion/disconnect`
  - Disconnects from Notion (removes stored tokens)
  - Response: `{ success: true, message: string }`

### Health Check
- **GET** `/health`
  - Server health check endpoint
  - Response: `{ status: "ok", message: "Server is running" }`

## OAuth Flow

1. User clicks "Connect Notion Workspace" in frontend
2. Frontend redirects user to Notion OAuth authorization page
3. User authorizes the integration
4. Notion redirects back to frontend at `http://localhost:5174/connect-notion?code=...`
5. Frontend captures the authorization code from URL
6. Frontend sends code to backend via POST `/api/notion/exchange-token`
7. Backend exchanges code for access token with Notion API
8. Backend stores token and returns success response
9. Frontend shows success message and redirects to dashboard
10. Backend can now make authenticated requests to Notion API on behalf of the user

## Notes

- Tokens are currently stored in memory (Map). In production, use a database.
- CORS is configured for `http://localhost:5173` (Vite default). Update for production.
- All Notion API requests use version `2022-06-28`.

