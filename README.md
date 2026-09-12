# WhatsApp Business Link Generator

A professional WhatsApp link generation tool for businesses to create personalized messages with contact management, template system, and bulk operations.

## 🚀 Features

- **File Upload Support**: Excel (.xlsx, .xls) and CSV file processing
- **Google Sheets Integration**: Direct import from Google Sheets
- **Template System**: Pre-built and custom message templates with variables
- **Contact Management**: Save, track, and manage contacts with status tracking
- **Advanced Search**: Multi-criteria search with saved queries
- **Bulk Operations**: Select multiple contacts for batch operations
- **Real-time Analytics**: Contact statistics and send rate tracking
- **Responsive Design**: Mobile-first responsive interface

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

### Prerequisites

- Node.js 20+
- pnpm (or npm / yarn)
- A Cloudflare account with a **D1** database
- Modern web browser

### Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/whatsapp-link-generator.git
cd whatsapp-link-generator
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Configure the database and login credentials:
\`\`\`bash
cp .env.example .env.local
pnpm auth:hash "your-password"   # prints AUTH_PASSWORD_HASH and JWT_SECRET
\`\`\`

Fill in your Cloudflare account ID, D1 database ID and API token.
See **[DATABASE.md](./DATABASE.md)** for where to find each value.

4. Create the database tables:
\`\`\`bash
pnpm db:migrate
pnpm db:verify
\`\`\`

5. Run the development server:
\`\`\`bash
pnpm dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) and sign in.

> **Data storage:** contacts, templates, settings and send history live in
> Cloudflare D1 — not in the browser. The app is behind a login.
> Full details, schema and API reference: **[DATABASE.md](./DATABASE.md)**.

## 📖 Usage

### Basic Workflow

1. **Upload Contacts**: Upload Excel/CSV files or import from Google Sheets
2. **Create Templates**: Design message templates with variables
3. **Generate Links**: Create personalized WhatsApp links
4. **Manage Contacts**: Track send status and manage contact database
5. **Bulk Operations**: Send messages to multiple contacts

### File Format Requirements

Your Excel/CSV file should contain these columns:
- **Phone Number** (required): Saudi phone numbers
- **Company Name** (optional): Business name
- **Company Category** (optional): Industry category
- **Website** (optional): Company website URL
- **Custom Columns**: Any additional data for personalization

### Template Variables

Use these variables in your message templates:
- `{companyName}` - Company name from your data
- `{companyCategory}` - Industry category
- `{website}` - Company website
- `{customField}` - Any custom column from your Excel file

## 🏗 Project Structure

\`\`\`
whatsapp-link-generator/
├── app/                          # Next.js App Router
│   ├── components/              # React components
│   │   ├── ui/                 # Reusable UI components (shadcn/ui)
│   │   ├── business/           # Business logic components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Business logic services
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── constants/              # Application constants
│   └── styles/                 # Global styles
├── docs/                       # Documentation
├── public/                     # Static assets
└── tests/                      # Test files
\`\`\`

## 📚 API Documentation

### Core Services

#### ContactService
Manages contact operations and data persistence.

\`\`\`typescript
// Save contacts to local storage
await ContactService.saveContacts(contacts)

// Load contacts from storage
const contacts = ContactService.loadContacts()

// Update contact status
await ContactService.updateStatus(contactId, 'sent')
\`\`\`

#### TemplateService
Handles message template operations and variable replacement.

\`\`\`typescript
// Replace variables in template
const message = TemplateService.replaceVariables(template, contact)

// Extract variables from template
const variables = TemplateService.extractVariables(template)
\`\`\`

#### FileService
Processes uploaded files and extracts contact data.

\`\`\`typescript
// Process Excel/CSV file
const result = await FileService.processFile(file, customMessage)

// Validate file format
const validation = FileService.validateFile(file)
\`\`\`

### Component Architecture

#### Core Components
- `ContactManagement`: Main contact management interface
- `MessageTemplates`: Template creation and management
- `AdvancedSearch`: Multi-criteria search functionality
- `ContactCard`: Individual contact display and actions

#### UI Components
All UI components follow shadcn/ui patterns and are fully typed with TypeScript.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

\`\`\`env
# Application Settings
NEXT_PUBLIC_APP_NAME="WhatsApp Business Link Generator"
NEXT_PUBLIC_UPLOAD_PASSWORD="your-secure-password"

# Google Sheets Integration (optional)
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY="your-api-key"

# Analytics (optional)
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
\`\`\`

### Application Constants

Configure app settings in `app/constants/app-constants.ts`:

\`\`\`typescript
export const APP_CONSTANTS = {
  APP_NAME: "WhatsApp Business Link Generator",
  UPLOAD_PASSWORD: "secure123",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_ITEMS_PER_PAGE: 20,
  BATCH_SEND_DELAY_MS: 2000,
}
\`\`\`

## 🧪 Testing

Run the test suite:

\`\`\`bash
npm run test
# or
yarn test
\`\`\`

Run tests in watch mode:

\`\`\`bash
npm run test:watch
# or
yarn test:watch
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Manual Deployment

\`\`\`bash
npm run build
npm run start
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write unit tests for new features
- Update documentation for API changes
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](./docs/)
- Contact: your-email@example.com

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
