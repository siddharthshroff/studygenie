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
   ```sh
   git clone https://github.com/yourusername/studygenie.git
   cd studygenie
   ```

2. **Install dependencies:**
   ```sh
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
  ```sh
  npm run build
  ```

- **Run tests:**
  ```sh
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