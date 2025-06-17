# 🔧 Troubleshooting Guide

## Network Connection Issues

### Problem: "Network Error" or "Unable to connect to the server"

#### Solution 1: Check Backend Server
1. **Start the backend server:**
   ```bash
   cd HealthApp/backend
   npm install
   npm start
   ```
   
2. **Verify server is running:**
   - You should see output like "Server running on port 5000"
   - Check if there are any error messages

#### Solution 2: Update API URL
If you're still getting connection errors, try these API URLs in `frontend/src/config/constants.ts`:

```javascript
// Option 1: Localhost (most common)
export const API_URL = 'http://localhost:5000';

// Option 2: Your computer's IP address
export const API_URL = 'http://192.168.0.103:5000';

// Option 3: 10.0.2.2 (for Android emulator)
export const API_URL = 'http://10.0.2.2:5000';

// Option 4: 127.0.0.1
export const API_URL = 'http://127.0.0.1:5000';
```

#### Solution 3: Check Network Configuration
1. **For Android Emulator:**
   - Use `10.0.2.2:5000` instead of `localhost:5000`
   
2. **For Physical Device:**
   - Use your computer's IP address (e.g., `192.168.0.103:5000`)
   - Make sure both devices are on the same network

3. **For iOS Simulator:**
   - Use `localhost:5000` or `127.0.0.1:5000`

#### Solution 4: Firewall Issues
1. **Check if port 5000 is blocked:**
   ```bash
   # On Windows
   netstat -an | findstr :5000
   
   # On Mac/Linux
   netstat -an | grep :5000
   ```

2. **Allow the port through firewall if needed**

#### Solution 5: Database Connection
1. **Check if PostgreSQL is running:**
   ```bash
   # On Windows
   services.msc  # Look for PostgreSQL service
   
   # On Mac
   brew services list | grep postgresql
   
   # On Linux
   sudo systemctl status postgresql
   ```

2. **Verify database configuration in `backend/config/config.js`**

## Common Error Messages

### "ERR_NETWORK"
- **Cause:** Backend server not running or wrong IP address
- **Fix:** Start backend server and verify API URL

### "ECONNREFUSED"
- **Cause:** Server not listening on the specified port
- **Fix:** Check if backend is running and port is correct

### "CORS Error"
- **Cause:** Cross-origin request blocked
- **Fix:** Ensure backend has CORS properly configured

## Quick Fix Commands

```bash
# 1. Stop all running processes
# Press Ctrl+C in all terminal windows

# 2. Start backend
cd HealthApp/backend
npm install
npm start

# 3. In a new terminal, start frontend
cd HealthApp/frontend
npm install
npx expo start

# 4. Test connection
curl http://localhost:5000/api/health
```

## Environment Variables

Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_app
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## Still Having Issues?

1. **Check the logs:**
   - Backend console output
   - Frontend Metro bundler output
   - Device/emulator logs

2. **Try different ports:**
   - Change backend port to 3000 or 8000
   - Update API_URL accordingly

3. **Restart everything:**
   - Close all terminals
   - Restart your development environment
   - Clear cache: `npx expo start --clear` 