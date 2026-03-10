# Hospital Management System - Setup Guide

## Prerequisites
- MySQL Server running (port 3306)
- Node.js installed
- The backend dependencies already installed

## Setup Instructions

### 1. Create the Database

Open MySQL and run the schema file:

```bash
mysql -u root -p < backend/hospital_schema.sql
```

Or copy-paste the contents of `hospital_schema.sql` into MySQL Workbench or command line.

### 2. Start the Backend Server

```bash
cd backend
npm start
```

You should see: `✅ Connected to MySQL database`

The server will run on: `http://localhost:5000`

### 3. Run Your Angular Frontend

In a new terminal:

```bash
cd app/hospital-app
ng serve
```

The frontend will be available at: `http://localhost:4200`

## API Endpoints

### Patients
- `POST /patients` - Add new patient
- `GET /patients` - Get all patients
- `GET /patients/:id` - Get patient by ID
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Departments
- `POST /departments` - Add new department
- `GET /departments` - Get all departments
- `DELETE /departments/:id` - Delete department

### Rooms
- `POST /rooms` - Add new room
- `GET /rooms` - Get all rooms
- `DELETE /rooms/:id` - Delete room

### Users (Existing)
- `POST /users` - Add new user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Database Connection

The backend is configured to connect to:
- **Host**: 127.0.0.1
- **User**: root
- **Password**: 123456789
- **Database**: arman
- **Port**: 3306

If you need to change these settings, edit `backend/index.js` lines 9-15.

## Testing

You can test the API using Postman or curl:

```bash
# Add a patient
curl -X POST http://localhost:5000/patients \
  -H "Content-Type: application/json" \
  -d '{
    "id_proof": "aadhar",
    "id_number": "1234567890",
    "name": "John Doe",
    "gender": "Male",
    "disease": "Fever",
    "deposit": 5000
  }'

# Get all patients
curl http://localhost:5000/patients
```

## Features Implemented

✅ Frontend form connected to backend API  
✅ Patient data saved to MySQL database  
✅ Form validation  
✅ Error handling  
✅ Database schema with relationships  
✅ CRUD endpoints for patients, departments, and rooms

## Next Steps

1. Connect other forms (newdepartment.html, newemployee.html, room.html)
2. Create pages to view/edit/delete records
3. Add authentication (JWT is already in dependencies)
4. Add input validation on frontend
5. Style the success/error messages
