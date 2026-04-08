# Instructions
I'm working on Windows with VSCode so these instructions are more geared toward that. I think this should work in other IDE's but I'm not sure.

With the following instructions you should be able to test front/backend development locally before deploying to the website.

**Please make sure to check backend and frontend readMe's as well for more info**

**I added google API keys for address validation and distance calculation, CONTACT ME FOR THEM**

## If you already downloaded Repo locally
enter `npm install` in front and backend directories to ensure installation of any packages i added, if nothing happens then they're already downloaded

Use new DB file for the updated DB hostend on railway. I'll add any new tables, views, triggers, or constraints here.

## Before cloning locally:

### On Windows
1. Use `git --version` to check if you have it installed already. If not Install Git using https://gitforwindows.org/
2. Use `node -v` and `npm -v` to check if they're already installed. On windows, use prebuilt node installer: https://nodejs.org/en/download/current
3. Download MySQL to connect to DB locally. https://dev.mysql.com/downloads/installer/

## Database Schema
I have a copy of the database schema that we will be using for this database in this repo its the **DB_on_Railway.sql** file
Dump it in a query tab and hit enter to create the database

## .ENV Files
Create a .env in both backend and frontend folders. .env files are in gitignore since you **don't want to push any .env files to main to maintain API security.**

### Backend .env Example
```
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
DB_PORT=3306_or_your_db_port
JWT_SECRET=Instructions_below
GOOGLE_MAPS_API_KEY=key_that_you_ask_me_for_so_i_dont_post_it_on_github_posing_a_security_issue
```

Run this in your terminal:

```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```

Copy the output and paste it into your `.env`:

``JWT_SECRET=paste_the_output_here``

### Frontend .env Example
`REACT_APP_API_URL=http://localhost:5000`

That's all you need in those two files

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
### Any changes you push to main will be deployed to the website. 

### Make all your changes in a seperate branch first.

# Where we're at currently

Backend connects to DB successfully, frontend and backend communicate successfully, authentication implemented

Login Page and Register Page are complete

Home page needs work in terms of adding buttons and links to any newly added pages like track package page

Tasks for Website:
- Create custom admin, customer, customer service, driver, handler, and uma home/dashboard pages that contain links to actions accessible to their role
- Create package tracking page: involves creating view from database, backend controller and routing for the page, frontend form page
- Add customer request page to change from regular to business
- Make a list of pages involving data entry/viewing that are only accessibile to specific roles
- Figure out how package/vehicle routing is going to be handled

### Next task I'm working on

Add create shipment using shipment calculator logic + appropriate query for insertion in all related shipment tables

## How Frontend and backend work together

Frontend → server.js → routes → middleware → controller → database → response

