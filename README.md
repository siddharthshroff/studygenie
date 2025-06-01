# StudyGenie

An AI-powered study application that transforms your documents into interactive flashcards and quizzes using OpenAI technology.

## Features

- 📄 **Document Processing**: Upload PDF, DOCX, TXT, PPTX, and MP4 files
- 🤖 **AI-Generated Content**: Automatically create flashcards and quizzes from your documents
- 📚 **Study Management**: Organize content into study sets with persistent storage
- 🔒 **User Authentication**: Secure login and user-specific content
- 🗂️ **File History**: Track and manage uploaded documents
- ✏️ **Content Editing**: Add, edit, and delete flashcards and quiz questions

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **OpenAI API Key** (from https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studygenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual values
   # Required: DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET
   ```

4. **Set up the database**
   ```bash
   # Push the database schema
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/studygenie` |
| `OPENAI_API_KEY` | OpenAI API key for content generation | `sk-...` |
| `SESSION_SECRET` | Secret key for session management | `your-secure-session-secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PGHOST` | PostgreSQL host | `localhost` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGUSER` | PostgreSQL username | - |
| `PGPASSWORD` | PostgreSQL password | - |
| `PGDATABASE` | PostgreSQL database name | - |

## Cross-Platform Setup

### Windows Setup

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Choose the LTS version

2. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/windows/
   - Remember the password you set for the `postgres` user

3. **Set up environment variables**
   ```cmd
   # Windows Command Prompt
   copy .env.example .env
   notepad .env
   ```

4. **Example DATABASE_URL for Windows**
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/studygenie
   ```

### macOS Setup

1. **Install Node.js**
   ```bash
   # Using Homebrew (recommended)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **Install PostgreSQL**
   ```bash
   # Using Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb studygenie
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   nano .env  # or use your preferred editor
   ```

4. **Example DATABASE_URL for macOS**
   ```
   DATABASE_URL=postgresql://yourusername@localhost:5432/studygenie
   ```

### Linux Setup

1. **Install Node.js**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or use your distribution's package manager
   ```

2. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Create database
   sudo -u postgres createdb studygenie
   ```

## Database Setup

### Local PostgreSQL

1. **Create a database**
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE studygenie;
   CREATE USER studygenie_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE studygenie TO studygenie_user;
   ```

2. **Update your .env file**
   ```
   DATABASE_URL=postgresql://studygenie_user:your_password@localhost:5432/studygenie
   ```

### Cloud PostgreSQL (Neon, Supabase, etc.)

1. Create a new database instance
2. Copy the connection string
3. Update your `.env` file with the provided `DATABASE_URL`

## API Keys Setup

### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Generate a new API key
4. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

**Note**: You'll need credits in your OpenAI account for the AI features to work.

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with cross-env |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript checks |
| `npm run db:push` | Push database schema changes |

---

## Code Structure

```
/
├── client/                # React frontend (main UI, components, styles)
│   ├── src/
│   │   ├── components/    # UI and feature components (e.g., file-history.tsx)
│   │   └── index.css      # Tailwind and custom styles
│   └── index.html         # App entry point
├── server/                # Express backend (routes, file processing, API)
│   ├── index.ts           # Server entry point
│   └── routes.ts          # API endpoints, file extraction, AI integration
├── shared/                # Shared code/types (if any)
├── attached_assets/       # Uploaded images/screenshots/assets
├── uploads/               # Uploaded files (runtime)
├── package.json           # Project scripts and dependencies
├── tailwind.config.ts     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── README.md              # Project documentation
```

---

## Main Components

- [`client/src/components/file-history.tsx`](client/src/components/file-history.tsx): Displays uploaded files and generated study materials.
- [`server/routes.ts`](server/routes.ts): Handles file uploads, text extraction, and AI-powered content generation.
- [`client/src/index.css`](client/src/index.css): Tailwind and custom CSS for theming and UI consistency.

---

## Technologies Used

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Multer (file uploads)
- **AI Integration:** OpenAI GPT API (for flashcard/quiz generation)
- **File Parsing:** pdf-parse, mammoth/docx-parser, pptx-parser, (stub for speech-to-text)
- **Other:** TypeScript, localStorage (for persistence), Replit (optional dev environment)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

---

## Contact

For questions or support, please open an issue on the repository.

---

**Happy Studying with StudyGenie!**