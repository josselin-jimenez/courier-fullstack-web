# Instructions
I'm working on Windows with VSCode so these instructions are more geared toward that. I think this should work in other IDE's but I'm not sure.
## Before cloning locally:

### On Windows
1. Use `git --version` to check if you have it installed already. If not Install Git using https://gitforwindows.org/
2. Use `node -v` and `npm -v` to check if they're already installed. On windows, use prebuilt node installer: https://nodejs.org/en/download/current
3. Download MySQL to connect to DB locally. https://dev.mysql.com/downloads/installer/

## Database Schema
I have a copy of the database schema that we will be using for this database in this repo its the **databaseSchema.sql** file
Dump it in a query tab and hit enter to create the database

## .ENV Files
Fill in with your own info where it says password, dbname, and token 
To create a random token:

Run this in your terminal:

``node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"``

Copy the output and paste it into your `.env`:

``JWT_SECRET=paste_the_output_here``

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
npm run dev
cd ../frontend
npm start
```

# Where we're at currently

Backend connects to DB, frontend and backend communicate successfully, authentication implemented

Now we need to create pages for front and backend and handle their permissions accordingly

For now lets focus on creating a **home page**, **login page**, **register page**, create shipment page, and maybe even a trackpackage page

In bold are the pages that only need a frontend backend is already handled.

I'm going to focus on the homepage so we have something to send Dr.Uma.

I'm thinking home page -> then figure out how to host on platform

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


## How Frontend and backend work together

Frontend → server.js → routes → middleware → controller → database → response

### server.js 

entry point to backend; starts the server and listens on a port; registers the route files so the server knows what URLs exist

### routes/authRoute.js

map of URLs to functions. No logic lives here - it just says:

- `POST /api/auth/register` -> run `register` function
- `POST /api/auth/login` -> run `login` function
- `GET /api/auth/me` -> run `verifyToken` first, then `getMe`

### middleware/authMiddleware.js

Code that runs between the route and the controller on protected routes. It has two functions:

- `verifyToken` — checks that the request includes a valid JWT token. If the token is missing, expired, or tampered with, it rejects the request immediately and the controller never runs. If valid, it attaches the decoded user info to `req.user` so the controller can use it.
- `requireRole` - checks that the logged-in user has the right role (e.g. admin). Used after `verifyToken`

### controllers/authController.js

Where the actual logic + business logic lives. Each function handles one action:

- `register` — checks if the email already exists, hashes the password with bcrypt, inserts the new user into the database
- `login` - looks up the user by email, compares the password against the stored hash, generates a JWT token and sends it back
- `getMe` - uses the user ID from the JWT (attached by `verifyToken`) to fetch fresh user data from the database

## How it all fits together — Login example

1. Frontend sends `POST /api/auth/login` with email and password
2. **server.js** receives it, passes it to the auth router
3. **authRoute.js** sees it matches `/login`, calls the `login` function
4. **authController.js** login queries the database, checks the password, returns a token
5. Frontend stores the token and uses it on future requests

For a protected route like `/me`:

1. Frontend sends GET /api/auth/me with Authorization: Bearer <token>
2. **authRoute.js** sees it matches `/me`, runs `verifyToken` first
3. **authMiddleware.js** `verifyToken` checks the token — if invalid, stops here with a 401 error
4. If valid, **authController.js** `getMe` runs and fetches the user from the database

# If you want to test Backend

1. Download Thunderclient extension on VSCode

**Test 1 — server is alive**
Method: GET
URL: http://localhost:5000/api/test
Click Send
You should get: { "message": "Backend is working!" }

**Test 2 — register a user**
Method: POST
URL: http://localhost:5000/api/auth/register
Click the Body tab → select JSON
Paste:

{
  "name": "John",
  "email": "john@test.com",
  "password": "password123",
  "phone": "1234567890"
}
Click Send
You should get: { "message": "Account created successfully." }

**Test 3 — login**
Method: POST
URL: http://localhost:5000/api/auth/login
Body → JSON:

{
  "email": "john@test.com",
  "password": "password123"
}
You should get back a token — copy it

**Test 4 — protected route**
Method: GET
URL: http://localhost:5000/api/auth/me
Click the Headers tab, add:
Name: Authorization
Value: Bearer paste_your_token_here
You should get back the user object
