# Instructions
I'm working on Windows with VSCode so these instructions are more geared toward that. I think this should work in other IDE's but I'm not sure.
## Before cloning locally:

### On Windows
1. Use `git --version` to check if you have it installed already. If not Install Git using https://gitforwindows.org/
2. Use `node -v` and `npm -v` to check if they're already installed. On windows, use prebuilt node installer: https://nodejs.org/en/download/current

## Once cloned:

In repository directory, once at a time enter
```
cd backend
npm install
cd ../frontend
npm install
```

To run, backend and frontend so far
```
cd backend
node server.js
cd ../frontend
npm start
```

# Understanding Dependencies

## Backend Dependencies
express → creates API routes (GET, POST)
cors → allows frontend to call backend
dotenv → stores secrets in .env file (DB password, JWT secret)
jsonwebtoken → creates login tokens
express-jwt → protects routes (checks token)
bcrypt → hashes passwords securely
mysql2 → connects to MySQL database
helmet → adds security headers
morgan → logs requests
nodemon → auto-restarts server on changes

## Frontend Dependencies
axios → calls backend APIs
react-router-dom → page navigation
jwt-decode → read user role from token

# What we have so far
Sadly...
Backend server running
Frontend calling backend

Next we need to add: authentication, connection to DB