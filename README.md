# EagleEye - Competitive Intelligence Dashboard

A React-based frontend application for tracking and analyzing competitor releases and features.

## Features

- Real-time competitive analysis
- Notion integration for automated syncing
- Email reporting capabilities
- Interactive dashboard with filtering and search
- PDF export functionality

## Frontend Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **CSS Modules** for styling

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Notion credentials.

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5174`

## Environment Configuration

Required environment variables:

- `VITE_NOTION_CLIENT_ID` - Your Notion OAuth client ID
- `VITE_REDIRECT_URI` - OAuth redirect URI (usually `http://localhost:5174/connect-notion`)
- `VITE_NOTION_API_KEY` - Your Notion integration API key

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── Components/          # React components
├── context/            # React context providers
├── services/           # API service functions
├── constants/          # Application constants
├── assets/            # Static assets
└── App.tsx            # Main application component
```

## Notion Integration

To set up Notion integration:

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Configure OAuth settings with your redirect URI
3. Add the client ID and API key to your `.env` file
4. Create a Notion page where data will be synced

For detailed setup instructions, see `NOTION_OAUTH_CHECKLIST.md`.
