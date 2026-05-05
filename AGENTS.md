# Repository Guidelines
- 구현이 우선. Security coding은 나중에 따로할것이니 명시하지 않은 security code는 넣지 말것



## Project Structure & Module Organization
This repository currently consists of a Node.js backend in `backend/` and an empty placeholder frontend directory in `front/`.

- `backend/app.js`, `server.js`: app bootstrap and HTTP server startup
- `backend/routes/`: Express route registration and feature handlers
- `backend/middlewares/`: CORS, session, passport, logging, and request middleware
- `backend/sql/`: MySQL pool setup and environment-based DB configuration
- `backend/sockets/`: Socket.IO manager and event listeners
- `backend/cron/`, `backend/utils/`, `backend/errors/`, `backend/exl/`: scheduled jobs, shared utilities, error types, and Excel helpers

Keep new files close to the feature they serve. Follow the existing folder split rather than creating broad utility dumps.

## Build, Test, and Development Commands
Run commands from `backend/`.

- `npm install`: install backend dependencies
- `npm run dev`: start the development server with `NODE_ENV=development`
- `npm run qa`: start the server with `NODE_ENV=qa`
- `npm run prod`: start the production profile with `forever`
- `npm test`: runs `node test.js`; treat this as a smoke-test entry point until fuller tests are added
