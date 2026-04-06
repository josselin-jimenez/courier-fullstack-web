# Understanding Backend Dependencies

| Dependency | Description |
|------------|-------------|
| express | creates API routes (GET, POST) |
| cors | allows frontend to call backend |
| dotenv | stores secrets in .env file (DB password, JWT secret) |
| jsonwebtoken | creates login tokens |
| express-jwt | protects routes (checks token) |
| bcrypt | hashes passwords securely |
| mysql2 | connects to MySQL database |
| helmet | adds security headers |
| morgan | logs requests |
| nodemon | auto-restarts server on changes |

# Understaning Backend Files

## server.js 

entry point to backend; starts the server and listens on a port; registers the route files so the server knows what URLs exist

## routes/authRoute.js

map of URLs to functions. No logic lives here - it just says:

- `POST /api/auth/register` -> run `register` function | Code Example: `router.post("/register", register);`
- `POST /api/auth/login` -> run `login` function | Code Example: `router.post("/login",    login);`
- `GET /api/auth/me` -> run `verifyToken` first, then `getMe` | Code Example: `router.get("/me", verifyToken, getMe);`

## middleware/authMiddleware.js

Code that runs between the route and the controller on protected routes aka any routes that use `route.get(...)`. It has two functions:

- `verifyToken` — checks that the request includes a valid JWT token. If the token is missing, expired, or tampered with, it rejects the request immediately and the controller never runs. If valid, it attaches the decoded user info to `req.user` so the controller can use it.
- `requireRole` - checks that the logged-in user has the right role (e.g. admin). Used after `verifyToken`

*using this folder for resuable validation checks* 

## controllers/authController.js

Where the actual logic + business logic lives. Each function handles one action:

- `register` — checks if the email already exists, hashes the password with bcrypt, inserts the new user into the database
- `login` - looks up the user by email, compares the password against the stored hash, generates a JWT token and sends it back
- `getMe` - uses the user ID from the JWT (attached by `verifyToken`) to fetch fresh user data from the database

*register, login, and getMe within same authcontroller.js file since they all handle authorization*

**any other pages added should create a NEW controller file**

# How it all fits together — Login example

1. Frontend sends `POST /api/auth/login` with email and password
2. **server.js** receives it, passes it to the auth router
3. **authRoute.js** sees it matches `/login`, calls the `login` function
4. **authController.js** login queries the database, checks the password, returns a token
5. Frontend stores the token and uses it on future requests

For a protected route like `/me`:

1. Frontend sends `GET /api/auth/me` 
2. **authRoute.js** sees it matches `/me`, runs `verifyToken` first
3. **authMiddleware.js** `verifyToken` checks the token — if invalid, stops here with a 401 error
4. If valid, **authController.js** `getMe` runs and fetches the user from the database

# If you want to test Backend

1. Download Thunderclient extension on VSCode

## Examples for POST and GET. Use these as a guide for any backend testing that might not exactly be this.

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
  "name": "John Test",
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