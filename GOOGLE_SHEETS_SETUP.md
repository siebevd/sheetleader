# Google Sheets Sync Setup

This guide explains how to set up Google Sheets synchronization for SheetLeader.

## Overview

The sync system:
- Syncs data from Google Sheets to your database every 30 seconds
- Adds new records, updates existing ones, and deletes removed ones
- Tracks all sync operations in a logs table
- Provides a status page at `/status` to monitor sync health

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `sheetleader-sync`
   - Description: `Service account for SheetLeader Google Sheets sync`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will download
6. Keep this file secure!

### 4. Share Your Google Sheet

1. Open your Google Sheet
2. Click the "Share" button
3. Add the service account email (found in the JSON file as `client_email`)
4. Give it "Viewer" permissions (read-only is sufficient)
5. Click "Send"

### 5. Get Your Sheet ID

The Sheet ID is in the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
```

### 6. Configure Environment Variables

Add these to your `app/.env` file:

```bash
# Copy the entire content of the service account JSON file
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...",...}'

# Your Google Sheet ID
GOOGLE_SHEET_ID=your_sheet_id_here
```

**Important**: The entire JSON must be on one line!

### 7. Set Up Your Google Sheet Structure

Your Google Sheet should have these columns (starting from row 1):

| A | B | C |
|---|---|---|
| Naam | Tractor | Score |

- **Row 1**: Headers (will be skipped)
- **Row 2+**: Data rows
- **Naam**: Participant name (required)
- **Tractor**: Tractor model (required)
- **Score**: Measured horsepower (optional, can be empty)

**Timestamp Handling:**
- Timestamps are automatically generated when a score is first added
- Timestamps update when a score changes
- Timestamps are cleared when a score is removed

Example:
```
| Naam          | Tractor       | Score |
|---------------|---------------|-------|
| Jan de Vries  | Fendt 939     | 156   |
| Piet Bakker   | John Deere 8R | 178   |
| Klaas Jansen  | Case IH Puma  |       |
```

**Note:** Leave the Score column empty for participants who haven't been measured yet. The timestamp will be automatically set when you add their score.

## Usage

### Status Page

Visit `https://yourdomain.com/status` to:
- See the current sync status
- View sync history
- Manually trigger a sync
- Monitor records added/updated/deleted

### API Endpoints

- `GET /api/sync/status` - Get current sync status
- `GET /api/sync/logs` - Get sync history (last 50 logs)
- `POST /api/sync/trigger` - Manually trigger a sync

### Automatic Sync

The system automatically syncs every 30 seconds when:
1. Both environment variables are configured
2. The server is running

Check the server logs for sync messages:
```bash
docker-compose logs -f backend
```

## Troubleshooting

### "credentials not configured" error
- Check that both `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` are set in `.env`
- Ensure the JSON is properly formatted (one line, valid JSON)

### "403 Forbidden" error
- Make sure you shared the sheet with the service account email
- Check that the service account has at least "Viewer" access

### "404 Not Found" error
- Verify the Sheet ID is correct
- Ensure the sheet name is "Sheet1" or update the range in code

### No data syncing
- Check that your sheet has data starting from row 2
- Verify columns A (Name) and B (Tractor) have values
- Look at `/status` page for error details

## Security Notes

- Never commit the service account JSON to git
- Keep the `.env` file secure
- Use read-only permissions for the service account
- Consider using environment variables in your deployment platform

## Development

To test locally:
1. Copy `app/.env.example` to `app/.env`
2. Add your credentials
3. Run `bun run dev` in the app directory
4. Visit `http://localhost:3000/status`
