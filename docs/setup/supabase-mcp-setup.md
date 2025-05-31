# Supabase MCP (Model Context Protocol) Setup Guide

This guide will help you set up the Supabase MCP server for Claude Desktop integration.

## Prerequisites

- Claude Desktop app installed
- Supabase project with service role key
- Node.js installed

## Installation

The Supabase MCP server has been installed globally:

```bash
npm install -g @supabase/mcp-server-supabase
```

## Configuration

### 1. Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Find the "service_role" key under "Project API keys"
4. Copy this key (keep it secure!)

### 2. Configure Claude Desktop

The configuration file has been created at:
`~/Library/Application Support/Claude/claude_desktop_config.json`

You need to update it with your service role key:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--supabase-url",
        "https://bujaaqjxrvntcneoarkj.supabase.co",
        "--supabase-service-role-key",
        "YOUR_SERVICE_ROLE_KEY_HERE"
      ]
    }
  }
}
```

Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key.

### 3. Restart Claude Desktop

After updating the configuration:
1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The Supabase MCP server should now be available

## Verification

To verify the setup is working:
1. Open Claude Desktop
2. In a new conversation, you should be able to use Supabase-specific commands
3. Try asking Claude to list tables in your Supabase database

## Security Notes

- **NEVER** commit your service role key to version control
- The service role key bypasses Row Level Security (RLS)
- Use it only in secure, server-side environments
- For production, consider using environment variables

## Available Features

With the Supabase MCP server, Claude can:
- Query and manipulate database tables
- Execute SQL queries
- Manage Supabase Storage
- Work with Supabase Auth
- Access Supabase Edge Functions

## Troubleshooting

If the MCP server isn't working:
1. Check the Claude Desktop logs for errors
2. Verify your service role key is correct
3. Ensure the Supabase URL matches your project
4. Try reinstalling the MCP server package

## Project Details

- **Supabase URL**: https://bujaaqjxrvntcneoarkj.supabase.co
- **Anon Key** (for client-side): Stored in `.env` as `VITE_SUPABASE_ANON_KEY`
- **Service Role Key**: Required for MCP server (get from Supabase dashboard)