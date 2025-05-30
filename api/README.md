# ManagMe API - MongoDB Implementation

A complete project management API built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Management**: Role-based authentication (Admin, Developer, DevOps, Guest)
- **Project Management**: Create, read, update, delete projects with member/viewer permissions
- **Story Management**: User stories with status tracking (Todo, In Progress, Done)
- **Task Management**: Tasks with time logging, priority levels, and assignee tracking
- **Authentication**: JWT-based authentication with refresh tokens and Google OAuth support
- **Authorization**: Role-based access control with granular permissions

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v5.0 or higher)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### Step 1: Clone and Navigate to API Directory

```bash
cd /path/to/your/project/api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/managme

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this

# Google OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Step 4: Start MongoDB

Ensure MongoDB is running on your system:

**Using MongoDB Community Edition:**
```bash
mongod
```

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: Build the Application

```bash
npm run build
```

### Step 6: Seed the Database (Optional)

Populate the database with sample data including test users:

```bash
npm run seed
```

This creates:
- **Admin User**: admin@example.com / admin123
- **Developer User**: developer@example.com / developer123  
- **DevOps User**: devops@example.com / devops123
- **Guest User**: guest@example.com / guest123
- **Sample Project** with stories and tasks

### Step 7: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The API will be available at `http://localhost:3001`

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3001/api/health-check
```

### User Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "password": "password123", "role": "developer"}'
```

### Projects (Authenticated)
```bash
# Get all projects (replace TOKEN with your JWT)
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nazwa": "New Project", "opis": "Project description"}'
```

## 📁 Project Structure

```
api/
├── config/
│   └── dbMongo.ts          # MongoDB connection configuration
├── controllers/
│   ├── projectController.ts # Project CRUD operations
│   ├── storyController.ts   # Story management
│   ├── taskController.ts    # Task management & time logging
│   └── userController.ts    # User management
├── middleware/
│   ├── auth.ts             # JWT authentication middleware
│   ├── roleAuth.ts         # Role-based authorization
│   └── ownershipAuth.ts    # Resource ownership checks
├── models/
│   ├── User.ts             # User schema with roles & authentication
│   ├── Project.ts          # Project schema with members/viewers
│   ├── Story.ts            # Story schema with status tracking
│   ├── Task.ts             # Task schema with time logging
│   └── RefreshToken.ts     # JWT refresh token storage
├── routes/
│   ├── auth.ts             # Authentication endpoints
│   ├── project.ts          # Project management routes
│   ├── stories.ts          # Story management routes
│   ├── tasks.ts            # Task management routes
│   └── users.ts            # User management routes
├── scripts/
│   └── seed.ts             # Database seeding script
├── utils/
│   ├── tokenUtil.ts        # JWT token utilities
│   └── dbSeeder.ts         # Database seeding logic
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── server.ts               # Main application entry point
└── tsconfig.json           # TypeScript configuration
```

## 🔐 User Roles & Permissions

### Admin
- Full access to all projects, stories, and tasks
- Can manage all users
- Can delete any resource

### Developer  
- Can create, edit, and delete projects
- Can create and edit stories and tasks
- Cannot delete resources owned by others
- Cannot manage users

### DevOps
- Similar to Developer role
- Can create, edit, and delete projects
- Can create and edit stories and tasks

### Guest
- **Read-only access** to assigned projects
- Can view projects where they are added as viewers
- Cannot create, edit, or delete any resources

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration  
- `POST /google` - Google OAuth login
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - User logout
- `GET /me` - Get current user info

### Projects (`/api/projects`)
- `GET /` - Get user's projects
- `POST /` - Create new project
- `GET /:id` - Get project by ID
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project
- `POST /:id/members` - Add project member
- `DELETE /:id/members` - Remove project member  
- `POST /:id/viewers` - Add project viewer
- `DELETE /:id/viewers` - Remove project viewer

### Stories (`/api/stories`)
- `GET /` - Get all stories
- `GET /project/:projectId` - Get stories by project
- `GET /:id` - Get story by ID
- `POST /` - Create new story
- `PUT /:id` - Update story
- `PUT /:id/status` - Update story status
- `DELETE /:id` - Delete story

### Tasks (`/api/tasks`)
- `GET /story/:storyId` - Get tasks by story
- `GET /project/:projectId` - Get tasks by project
- `GET /:taskId` - Get task by ID
- `POST /` - Create new task
- `PUT /:taskId` - Update task
- `PUT /:taskId/status` - Update task status
- `DELETE /:taskId` - Delete task
- `POST /:taskId/timelog` - Add time log entry

### Users (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `GET /role/:role` - Get users by role
- `POST /` - Create user (Admin only)
- `PUT /:id/role` - Update user role (Admin only)
- `DELETE /:id` - Delete user (Admin only)

## 📊 Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  firstName: string,
  lastName: string,
  email: string (unique),
  passwordHash?: string,
  role: 'admin' | 'developer' | 'devops' | 'guest',
  authProvider: 'local' | 'google',
  googleId?: string,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Collection
```typescript
{
  _id: ObjectId,
  nazwa: string,
  opis: string,
  ownerId: ObjectId,
  members: [{ userId: ObjectId, assignedAt: Date }],
  viewers: [{ userId: ObjectId, assignedAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### Story Collection
```typescript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: string,
  description?: string,
  status: 'todo' | 'in-progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  ownerId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Collection
```typescript
{
  _id: ObjectId,
  name: string,
  description?: string,
  status: 'todo' | 'in-progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  projectId: ObjectId,
  storyId: ObjectId,
  assignedUserId?: ObjectId,
  estimatedTime?: number,
  loggedHours: number,
  startDate?: Date,
  endDate?: Date,
  timeLogs: [{ 
    date: Date, 
    hours: number, 
    comment?: string, 
    userId?: ObjectId 
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Available NPM Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run seed` - Seed database with sample data

## 🐛 Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `mongod`
2. Check the `MONGODB_URI` in your `.env` file
3. Verify MongoDB is accessible on the specified port

### Authentication Issues
1. Ensure `JWT_SECRET` is set in your `.env` file
2. Check that the token is included in request headers: `Authorization: Bearer <token>`
3. Verify token hasn't expired (default: 24 hours)

### Permission Denied Errors
1. Check user role and permissions
2. Verify the user has access to the requested resource
3. Ensure proper ownership or membership of projects

### Port Already in Use
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

## 🔒 Security Notes

- Change default JWT secrets in production
- Use HTTPS in production environments
- Implement rate limiting for authentication endpoints
- Regular security audits of dependencies
- Validate and sanitize all user inputs

## 📝 Development Notes

- The API uses MongoDB ObjectIds instead of UUIDs
- Time logging is embedded within task documents
- Role-based access control is implemented at the middleware level
- Google OAuth integration is optional and configurable
- Database seeding creates test data for all user roles

---

**Ready to start developing!** 🎉

The ManagMe API is now fully configured with MongoDB and ready for development. All endpoints are properly authenticated and authorized based on user roles.
