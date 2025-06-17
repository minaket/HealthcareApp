# HealthcareApp

A comprehensive healthcare management application built with React Native (Expo) for the frontend and Node.js/Express for the backend. The app provides a complete solution for patients, doctors, and administrators to manage healthcare services.

## 🏥 Features

### For Patients
- **Dashboard**: View health summary, upcoming appointments, and recent medical records
- **Appointment Management**: Schedule, view, and manage appointments with doctors
- **Medical Records**: Access and view medical history, prescriptions, and test results
- **Messaging**: Secure communication with healthcare providers
- **Profile Management**: Update personal information and health details

### For Doctors
- **Patient Management**: View patient list and medical histories
- **Appointment Management**: Manage scheduled appointments and consultations
- **Medical Records**: Create and update patient medical records
- **Prescription Management**: Issue and manage prescriptions
- **Messaging**: Communicate with patients securely

### For Administrators
- **User Management**: Manage doctors, patients, and system users
- **System Monitoring**: View system statistics and activity logs
- **Settings Management**: Configure system settings and policies

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for navigation
- **Axios** for API communication
- **Expo Vector Icons** for icons

### Backend
- **Node.js** with Express.js
- **Sequelize** ORM for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- **CORS** for cross-origin requests

## 📱 Screenshots

[Add screenshots here when available]

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/HealthcareApp.git
   cd HealthcareApp
   ```

2. **Backend Setup**
   ```bash
   cd HealthApp/backend
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database
   - Update the database configuration in `src/config/config.js`
   - Run migrations:
     ```bash
     npm run migrate
     ```
   - Seed the database:
     ```bash
     npm run seed
     ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Environment Configuration**
   - Copy the `env` file to `.env` in the frontend directory
   - Update the API URL in the `.env` file to match your backend server

6. **Start the Backend**
   ```bash
   cd ../backend
   npm start
   ```

7. **Start the Frontend**
   ```bash
   cd ../frontend
   npx expo start
   ```

## 📁 Project Structure

```
HealthcareApp/
├── HealthApp/
│   ├── backend/                 # Backend server
│   │   ├── src/
│   │   │   ├── controllers/     # Route controllers
│   │   │   ├── models/          # Database models
│   │   │   ├── routes/          # API routes
│   │   │   ├── middleware/      # Custom middleware
│   │   │   ├── utils/           # Utility functions
│   │   │   └── config/          # Configuration files
│   │   ├── migrations/          # Database migrations
│   │   ├── seeders/             # Database seeders
│   │   └── tests/               # Backend tests
│   └── frontend/                # React Native app
│       ├── src/
│       │   ├── screens/         # App screens
│       │   ├── components/      # Reusable components
│       │   ├── navigation/      # Navigation configuration
│       │   ├── store/           # Redux store
│       │   ├── hooks/           # Custom hooks
│       │   ├── services/        # API services
│       │   ├── types/           # TypeScript types
│       │   └── utils/           # Utility functions
│       └── assets/              # Images and static files
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Bcrypt hashing for passwords
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet Security**: Security headers for Express.js

## 🧪 Testing

### Backend Tests
```bash
cd HealthApp/backend
npm test
```

### Frontend Tests
```bash
cd HealthApp/frontend
npm test
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Patient Endpoints
- `GET /api/patient/health-summary` - Get patient health summary
- `GET /api/patient/appointments` - Get patient appointments
- `GET /api/patient/appointments/upcoming` - Get upcoming appointments
- `GET /api/patient/medical-records` - Get medical records

### Doctor Endpoints
- `GET /api/doctor/appointments` - Get doctor appointments
- `GET /api/doctor/patients` - Get doctor's patients
- `POST /api/doctor/medical-records` - Create medical record

### Message Endpoints
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React Native community
- Expo team
- Express.js community
- All contributors and testers

## 📞 Support

If you have any questions or need support, please open an issue on GitHub or contact the development team.

---

**Note**: This is a healthcare application. Please ensure compliance with relevant healthcare regulations (HIPAA, GDPR, etc.) before deploying in a production environment. 