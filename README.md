# GalaxyDocs - Real-Time Collaborative Editor

A modern, Notion-like collaborative document editor with a stunning galaxy theme.

## ✨ Features

-  Real-time collaborative editing
-  Galaxy-themed UI with animations
-  Live presence indicators
-  Rich text editing with Tiptap
-  Auto-save functionality
-  Mobile-responsive design
- ⚡ WebSocket real-time communication

## Tech Stack

### Frontend
- React 18 with Vite
- Tiptap Editor
- Socket.io-client
- React Router
- Custom CSS (Galaxy theme)

### Backend
- Node.js + Express.js
- Socket.io
- In-memory storage (demo)

##  Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. Install all dependencies:




### Setup Instructions
Frontend
1.	Open terminal and navigate to the frontend directory:
- cd frontend
2.	Install dependencies:
- npm install
3.	Start React development server (default localhost:3000):
- npm run dev
Backend
1.	Open terminal and navigate to the backend directory:
- cd backend
2.	Install dependencies:
- npm install
3.	Start Express + Socket.io server (default port 5000):
- npm run dev
4.	Ensure .env is configured in backend root with proper Firebase credentials and secret keys.

### 2. API Documentation
### Authentication API (/api/auth)
Endpoint	Method	Description	Request Body	Response
- /register	POST	Register new user	{ email, password, displayName }	{ token, user: { uid, email, displayName } }
- /login	POST	Login user	{ email, password }	{ token, user: { uid, email, displayName } }
- /verify	GET	Verify JWT token	Header: Authorization: Bearer <token>	User info if token valid
- /refresh	POST	Refresh JWT token	{ refreshToken }	{ token }
### Document API (/api/documents)
All endpoints below require Authorization header with a valid JWT token.
Endpoint	Method	Description	Request Body / Params	Response
- /	GET	Get all documents for user	—	List of documents
- /	POST	Create a new document	{ title, content? }	Created document
- /:id	GET	Get document by ID	URL param: id	Document data
- /:id	PUT	Update a document	URL param: id, body { title?, content? }	Updated document
- /:id	DELETE	Delete a document	URL param: id	204 No Content
- /:id/share	POST	Share document with user	`{ userEmail, permission: "read"	"write"


### Advanced Document API (/api/documents)
Endpoint	Method	Description	Request Body / Params	Response
- /:id/export	GET	Export document to html, pdf, or docx	URL param id, optional query param format	Exported file content
- /:id/versions	GET	Get document version history	URL param id	List of versions
- /from-template	POST	Create document from a predefined template	{ templateId, title }	Created document
- /:id/duplicate	POST	Duplicate a document	URL param id	New duplicated document
- /:id/analytics	GET	Get analytics data for a document	URL param id	Analytics data
- /:id/comments	POST	Add comment to a document	{ content, position?, selectedText? }	Created comment
- /:id/comments	GET	Get all comments on a document	URL param id	List of comments



