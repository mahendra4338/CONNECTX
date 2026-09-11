# CONNECTX

CONNECTX is a cooperative worker marketplace prototype with a Node.js backend and a browser frontend.

## Project structure

```text
connectx/
├── server.js
├── package.json
├── README.md
└── public/
    ├── index.html
    ├── style.css
    ├── app.js
    └── images/
        ├── logo.svg
        ├── connectx-hero.svg
        └── cooperative.svg
```

## Run

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Demo login

Email: `admin@connectx.in`

Password: `connectx123`

## Authentication

- Email/password login
- Phone OTP demo login
- Customer registration
- Worker registration with skills and payout details
- Forgot password → reset code → new password
- Logout

OTP and password-reset codes are shown in the browser in demo mode. Real SMS requires Twilio environment variables.

## Important

This is a prototype. User accounts, OTP challenges, password-reset challenges, and bookings are stored in memory and are reset when the Node.js server restarts. Passwords are hashed with SHA-256 for this demo; production authentication should use a modern password hashing scheme, persistent database storage, sessions/JWT, rate limiting, CSRF protection, and secure secrets.
