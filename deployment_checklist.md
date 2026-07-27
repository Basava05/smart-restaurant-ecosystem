# SRS Deployment & Production Checklist

Before taking a massive project like the Smart Restaurant Ecosystem live, it is critical to ensure security, performance, and correct configuration.

## 1. Regarding your Hardcoded Logins
Yes, the accounts you created (Admin, Owner, Chef) **will work in production** assuming you migrate your database (or recreate them in your production database). 

> [!WARNING]
> **Remove Auto-fills:** If you hardcoded emails and passwords directly into the `Login.jsx` input fields for quick testing, you **must remove these** before deploying. Otherwise, anyone visiting your live site will see those credentials autofilled and gain full access to your admin or owner panels!

---

## 2. Environment Variables (.env)
Your `.env` files are the most critical part of deployment. You must create production versions of these keys:
*   **MongoDB URI:** Do not use your local or development database. Create a fresh cluster on MongoDB Atlas specifically for production.
*   **JWT_SECRET:** Generate a new, extremely long, and random string for production. Never reuse your local dev secret.
*   **RazorPay:** Switch from your "Test" RazorPay API Keys to your "Live" API Keys.
*   **Cloudinary:** Ensure your Cloudinary limits are sufficient for production traffic.

## 3. Frontend Deployment (React/Vite)
*   **API URL:** You must change `VITE_API_URL` in your client `.env` from `http://localhost:5000` to your live backend domain (e.g., `https://api.smarteats.com`).
*   **Build:** The frontend should be built using `npm run build`. You can host the resulting `dist` folder on platforms like **Vercel**, **Netlify**, or AWS S3. 

## 4. Backend Deployment (Node/Express)
*   **CORS Configuration:** Update your backend CORS configuration to **only** allow requests from your live frontend domain. *Do not leave it open (`*`)*.
*   **Security Packages:** Ensure you have basic security headers. I highly recommend installing and using `helmet` and `express-rate-limit` on your Node server to prevent basic attacks and spam.
*   **Hosting:** Deploy your backend to a reliable host like **Render**, **Heroku**, **Railway**, or AWS EC2.

## 5. Third-Party API Security
*   **Gemini AI Key:** Go to your Google Cloud Console and add "API Restrictions" to your Gemini API Key so it can only be used by your specific backend server IP. This prevents someone from stealing your key and using up your quota.
*   **Google Maps API (If used):** Restrict your Maps API key to only accept requests from your production frontend URL.

## 6. Final Polish
*   **Remove Console Logs:** Clean up any `console.log` statements in both the frontend and backend, especially those logging sensitive data like user objects or order details.
*   **Error Handling:** Ensure your backend doesn't leak stack traces. In Express, ensure error responses only send generic messages to the client, not the full code error.
