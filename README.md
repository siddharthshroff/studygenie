# StudyGenie

StudyGenie is a full-stack web application designed to help students study more effectively by allowing them to upload study materials (PDF, DOCX, TXT, PPTX, MP4), automatically extract content, and generate AI-powered flashcards and quizzes. The app features a modern React frontend styled with Tailwind CSS and a Node.js/Express backend for file processing and API endpoints.

---

## Features

- **Upload Study Materials:** Drag-and-drop or browse to upload PDF, DOCX, TXT, PPTX, or MP4 files.
- **AI-Generated Flashcards & Quizzes:** Automatically generate flashcards and multiple-choice quizzes using OpenAI GPT.
- **Flashcard Editor:** Edit, delete, or add flashcards manually.
- **Save & Organize:** Store flashcard sets locally with titles and timestamps.
- **Clean UI:** Responsive, modern interface inspired by educational platforms.

---

## Installation

1. **Clone the repository:**
   ```
   git clone https://github.com/yourusername/studygenie.git
   cd studygenie
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

---

## Running the Application

- **Start the development server:**
  ```sh
  npm run dev
  ```
  This will start both the backend (Express) and the frontend (Vite + React).

- **Build for production:**
  ``
  npm run build
  ```

- **Run tests:**
  ```
  npm test
  ```

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

---

## API Endpoints

### POST /upload

- **Description:** Upload study materials (PDF, DOCX, TXT, PPTX, MP4) for processing and AI integration.
- **Request Body:** Form-data containing the file and metadata (e.g., title, description).
- **Response:** JSON object with success status and links to generated flashcards/quizzes.

### GET /flashcards

- **Description:** Retrieve flashcards for a specific user or study session.
- **Query Parameters:** `userId` (optional), `sessionId` (optional)
- **Response:** JSON array of flashcards with details (e.g., question, answer, tags).

### POST /flashcards/generate

- **Description:** Generate AI-powered flashcards from uploaded study materials.
- **Request Body:** JSON object with user/session identifiers and file references.
- **Response:** JSON object with success status and links to the generated flashcards.

### POST /quizzes/generate

- **Description:** Generate AI-powered quizzes from uploaded study materials.
- **Request Body:** JSON object with user/session identifiers and file references.
- **Response:** JSON object with success status and links to the generated quizzes.

---

## Middleware

### authenticateUser

- **Description:** Middleware to authenticate users based on session or token.
- **Request:** Expects `Authorization` header with a valid token.
- **Response:** 401 Unauthorized if authentication fails; 200 OK if successful.

---

## Database Schema (Simplified)

### Users

| Field     | Type    | Description                  |
|-----------|---------|------------------------------|
| id        | String  | Unique identifier for user   |
| email     | String  | User's email address         |
| password  | String  | Hashed password               |
| createdAt | Date    | Account creation timestamp   |

### Flashcards

| Field     | Type    | Description                          |
|-----------|---------|--------------------------------------|
| id        | String  | Unique identifier for flashcard     |
| userId    | String  | Identifier of the owner (User)      |
| question  | String  | Question text                        |
| answer    | String  | Answer text (or link to resource)   |
| tags      | Array   | Array of tags/keywords              |
| createdAt | Date    | Flashcard creation timestamp        |

### Sessions

| Field     | Type    | Description                          |
|-----------|---------|--------------------------------------|
| id        | String  | Unique identifier for session       |
| userId    | String  | Identifier of the owner (User)      |
| title     | String  | Session title                        |
| createdAt | Date    | Session creation timestamp          |

---

## Example Usage

1. **Upload a study material:**
   - POST `/upload` with a PDF file.
   - Response: `{ "success": true, "flashcardLink": "/flashcards/123" }`

2. **Generate flashcards:**
   - POST `/flashcards/generate` with session ID.
   - Response: `{ "success": true, "flashcardLink": "/flashcards/123" }`

3. **Retrieve flashcards:**
   - GET `/flashcards?sessionId=123`
   - Response: `[ { "id": "1", "question": "What is X?", "answer": "X is...", "tags": ["tag1"], "createdAt": "2023-10-01T12:00:00Z" }, ... ]`

---

## Development Notes

- Use `npm run dev` for development with hot-reloading.
- Backend API docs are in `server/routes.ts`.
- Frontend components are in `client/src/components/`.
- For AI features, ensure OpenAI API key is set in environment variables.

---

## Troubleshooting

- **Common issues during setup:**
  - Ensure all dependencies are installed (`npm install`).
  - Check that the correct version of Node.js is being used.
  - For database issues, ensure the database is running and accessible.

- **Issues with AI features:**
  - Ensure the OpenAI API key is set in the environment variables.
  - Check the network connection and API status.

---

## Future Enhancements

- Support for more file types (e.g., images, audio).
- Advanced AI features (e.g., summarization, topic detection).
- Collaboration features (e.g., shared flashcard sets, group quizzes).
- Mobile app version for offline access and notifications.

---

## Acknowledgments

- Inspired by educational platforms and tools.
- Leveraging OpenAI's GPT for intelligent content generation.
- Built with love by the StudyGenie team.

---

## Contact

For any inquiries, suggestions, or feedback, please reach out to us at [support@studygenie.com](mailto:support@studygenie.com). We would love to hear from you!