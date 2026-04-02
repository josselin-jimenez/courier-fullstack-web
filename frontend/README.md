# Understanding Frontend Dependencies

| Dependency | Description |
|------------|-------------|
| axios | calls backend APIs |
| react-router-dom | page navigation |
| jwt-decode | read user role from token |

# Understanding Frontend Files

## api/axios.js

HTTP client, auto-attaches user token to all user API calls

## components/

UI pieces shared across multiple pages

## context/authContext.js

Holds the token and decoded user object globally. Any component calls `useAuth()` to access it.

## pages/

Individual pages for each screen in the app where page UI is created and page specific input forms and API calls are handled.

## routes/

**PrivateRoute.js**

Blocks unauthenticated/wrong-role users

**PublicRoute.js**

Redirects logged-in users away from login/register

## services/

Where API call functions reside

## App.js

All routes/links defined here
