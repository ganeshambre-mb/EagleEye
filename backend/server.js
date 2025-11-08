import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Vite default and alternate ports
  credentials: true
}));
app.use(express.json());

// Store tokens temporarily (in production, use a database)
const userTokens = new Map();

// Notion OAuth token exchange endpoint (called from frontend)
app.post("/api/notion/exchange-token", async (req, res) => {
  console.log('📥 Received token exchange request');
  const { code } = req.body;

  if (!code) {
    console.error('❌ No authorization code provided');
    return res.status(400).json({ success: false, error: "No authorization code provided" });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || "http://localhost:5174/connect-notion";

  if (!clientId || !clientSecret) {
    console.error('❌ Missing Notion credentials in environment variables');
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error: Missing Notion credentials" 
    });
  }

  console.log('🔄 Exchanging code with Notion API...');
  console.log('Configuration:', {
    redirectUri,
    clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
    clientSecret: clientSecret ? '***' : 'NOT SET',
  });
  
  try {
    // Exchange code for access token
    const response = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      },
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Save tokens for the user
    const notionAccessToken = response.data.access_token;
    const workspaceId = response.data.workspace_id;
    const botId = response.data.bot_id;

    // Store token (in production, associate with a user session)
    const userId = "default_user"; // Replace with actual user ID from your auth system
    userTokens.set(userId, {
      accessToken: notionAccessToken,
      workspaceId,
      botId,
      timestamp: Date.now(),
    });

    console.log("✅ Successfully connected to Notion workspace:", workspaceId);

    // Return success response
    res.json({
      success: true,
      workspaceId,
      message: "Successfully connected to Notion",
    });
  } catch (error) {
    console.error("❌ Error exchanging Notion code for token");
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Provide helpful error message based on Notion's response
    let errorMessage = "Failed to exchange code for access token";
    if (error.response?.status === 401) {
      errorMessage = "Invalid Notion Client ID or Secret. Check your .env file.";
    } else if (error.response?.data?.error === "invalid_grant") {
      errorMessage = "Invalid or expired authorization code. The code may have already been used or the redirect_uri doesn't match.";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message,
    });
  }
});

// Endpoint to get user's Notion token status
app.get("/api/notion/status", (req, res) => {
  const userId = "default_user"; // Replace with actual user ID
  const tokenData = userTokens.get(userId);

  if (tokenData) {
    res.json({
      connected: true,
      workspaceId: tokenData.workspaceId,
      connectedAt: new Date(tokenData.timestamp).toISOString(),
    });
  } else {
    res.json({
      connected: false,
    });
  }
});

// Endpoint to fetch Notion pages (example)
app.get("/api/notion/pages", async (req, res) => {
  const userId = "default_user"; // Replace with actual user ID
  const tokenData = userTokens.get(userId);

  if (!tokenData) {
    return res.status(401).json({ error: "Not connected to Notion" });
  }

  try {
    const response = await axios.post(
      "https://api.notion.com/v1/search",
      {
        filter: {
          property: "object",
          value: "page",
        },
        page_size: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Notion pages:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Notion pages" });
  }
});

// Endpoint to sync releases to Notion
app.post("/api/notion/sync-releases", async (req, res) => {
  const userId = "default_user"; // Replace with actual user ID
  const tokenData = userTokens.get(userId);

  if (!tokenData) {
    return res.status(401).json({ success: false, error: "Not connected to Notion" });
  }

  const { releases } = req.body;

  if (!releases || !Array.isArray(releases)) {
    return res.status(400).json({ success: false, error: "Invalid releases data" });
  }

  console.log(`📤 Syncing ${releases.length} releases to Notion...`);
  console.log('Access token available:', tokenData.accessToken ? 'YES' : 'NO');

  try {
    // Use the specific Eagle Eye Integration Page
    // Format the page ID correctly for Notion API (add hyphens in UUID format)
    const rawPageId = "2a4beee2c20b80f08975fcc1540e3d2c";
    // Convert to proper UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const notionPageId = `${rawPageId.slice(0, 8)}-${rawPageId.slice(8, 12)}-${rawPageId.slice(12, 16)}-${rawPageId.slice(16, 20)}-${rawPageId.slice(20)}`;
    
    console.log(`📄 Adding data directly to existing Notion page: ${notionPageId}`);
    console.log('First release data:', JSON.stringify(releases[0], null, 2));

    // Add header blocks to the existing page
    const headerBlocks = [
      {
        object: "block",
        type: "divider",
        divider: {}
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ 
            text: { 
              content: `🔄 Sync - ${new Date().toLocaleString()}` 
            } 
          }],
          color: "blue"
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ 
            text: { 
              content: `📊 ${releases.length} competitive releases synced from Eagle Eye Dashboard` 
            } 
          }]
        }
      }
    ];

    // Add header blocks to the page
    console.log('📝 Adding header blocks...');
    try {
      await axios.patch(
        `https://api.notion.com/v1/blocks/${notionPageId}/children`,
        {
          children: headerBlocks
        },
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ Added header to page: ${notionPageId}`);
    } catch (headerError) {
      console.error('❌ Failed to add header blocks:', headerError.response?.data || headerError.message);
      throw headerError;
    }
    
    const parentPageId = notionPageId; // Use the existing page as parent

    // Create table header and rows as table block
    // Note: Notion tables have a limit of 100 rows per table
    const maxRowsPerTable = 99; // 1 for header + 99 data rows = 100 total
    const releasesToSync = releases.slice(0, maxRowsPerTable);
    
    if (releases.length > maxRowsPerTable) {
      console.log(`⚠️ Warning: Only syncing first ${maxRowsPerTable} releases due to Notion table limit`);
    }
    
    // Create table with proper structure
    const tableBlock = {
      object: "block",
      type: "table",
      table: {
        table_width: 5,
        has_column_header: true,
        has_row_header: false,
        children: [
          // Header row
          {
            type: "table_row",
            table_row: {
              cells: [
                [{ type: "text", text: { content: "Competitor" }, annotations: { bold: true } }],
                [{ type: "text", text: { content: "Feature" }, annotations: { bold: true } }],
                [{ type: "text", text: { content: "Summary" }, annotations: { bold: true } }],
                [{ type: "text", text: { content: "Category" }, annotations: { bold: true } }],
                [{ type: "text", text: { content: "Date" }, annotations: { bold: true } }]
              ]
            }
          },
          // Data rows
          ...releasesToSync.map(release => ({
            type: "table_row",
            table_row: {
              cells: [
                [{ type: "text", text: { content: release.competitor || "" } }],
                [{ type: "text", text: { content: release.feature || "" } }],
                [{ type: "text", text: { content: release.summary || "" } }],
                [{ type: "text", text: { content: release.category || "" } }],
                [{ type: "text", text: { content: release.date || "" } }]
              ]
            }
          }))
        ]
      }
    };

    // Add table to the page
    console.log('📊 Creating table block...');
    console.log('Table structure preview:', {
      width: tableBlock.table.table_width,
      hasHeader: tableBlock.table.has_column_header,
      rowCount: tableBlock.table.children.length
    });
    
    try {
      await axios.patch(
        `https://api.notion.com/v1/blocks/${parentPageId}/children`,
        {
          children: [tableBlock]
        },
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ Added table with ${releasesToSync.length} rows`);
    } catch (tableError) {
      console.error('❌ Failed to add table:', JSON.stringify(tableError.response?.data, null, 2));
      throw tableError;
    }

    console.log(`✅ Successfully synced ${releasesToSync.length} releases to Notion`);

    res.json({
      success: true,
      message: `Successfully synced ${releasesToSync.length} releases as table to Eagle Eye Integration Page`,
      pageId: parentPageId,
      pageUrl: `https://notion.so/${parentPageId.replace(/-/g, '')}`,
      syncedCount: releasesToSync.length,
      totalCount: releases.length
    });
  } catch (error) {
    console.error("❌ Error syncing releases to Notion");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Full error:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to sync releases to Notion",
      details: error.response?.data || error.message,
      statusCode: error.response?.status
    });
  }
});

// Endpoint to disconnect Notion
app.post("/api/notion/disconnect", (req, res) => {
  const userId = "default_user"; // Replace with actual user ID
  userTokens.delete(userId);
  res.json({ success: true, message: "Disconnected from Notion" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Notion OAuth callback URL: http://localhost:${PORT}/notion-oauth-callback`);
});

