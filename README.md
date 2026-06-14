# StudentSwap

This project now includes a React frontend and an Express + MongoDB backend for login session persistence.

## Setup

1. Create a MongoDB connection string.
2. Start the backend with `MONGODB_URI` set.
3. Start the Vite frontend in a second terminal.

```bash
MONGODB_URI="your-mongodb-connection-string" npm run server
npm run dev
```

The frontend sends `/api` requests to the backend through the Vite dev proxy at `http://localhost:5000`.

## Session Persistence

- Logging in creates a session record in MongoDB.
- The browser keeps only the session token in local storage.
- Refreshing the page restores the logged-in user from MongoDB instead of resetting to the login screen.
