# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0c0e6d13-2bca-42e4-be78-98828f5e1f1f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0c0e6d13-2bca-42e4-be78-98828f5e1f1f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0c0e6d13-2bca-42e4-be78-98828f5e1f1f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Feature Highlights

### Contact Management
- Create and manage contacts with customizable fields
- In-line editing for all contact fields
- Field types: text, number, date, select, multi-select, boolean
- Add, edit, and remove custom fields

### Company Management
- Track companies with custom fields
- Associate contacts with companies
- View company activity

### Deal Pipeline
- Visual pipeline board for tracking deals
- Drag and drop deals between stages
- Custom pipeline stages and deal properties

### Tasks & Notes
- Create tasks associated with contacts, companies or deals
- Take notes and attach them to records
- Set due dates and reminders

### Email Integration
- Connect Gmail accounts via OAuth
- Track email opens and clicks
- Two-way sync with Gmail contacts
- Send emails directly from the CRM
- View email history for contacts
- Compose emails with rich text editor

### Gmail OAuth Configuration
To properly configure the Gmail OAuth integration:

1. Set up a Google OAuth Client ID and Client Secret in the [Google Cloud Console](https://console.cloud.google.com/)
2. Configure the Supabase Edge Function environment variables:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GMAIL_REDIRECT_URI=https://your-domain.com/auth-callback.html
   ```
3. Ensure the redirect URI points to the `auth-callback.html` page in your domain

**Important**: For local development, set the GMAIL_REDIRECT_URI to `http://localhost:5173/auth-callback.html` (or your local dev server URL).

### Campaign Management
- Create and track email campaigns
- View campaign performance metrics
- Monitor open and click rates
