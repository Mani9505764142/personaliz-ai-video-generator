# Personalized Video Delivery App

A full-stack application for creating and delivering personalized videos via WhatsApp, built with Next.js, Express.js, PostgreSQL, and Docker.

## 🚀 Features

- **AI-Powered Video Generation**: Create personalized videos using advanced AI technology
- **WhatsApp Integration**: Send videos directly through WhatsApp messaging
- **Modern UI**: Beautiful Material-UI interface with responsive design
- **Real-time Status**: Track video generation progress and delivery status
- **User Management**: Secure authentication and user profiles
- **Docker Support**: Easy deployment with Docker Compose

## 🏗️ Architecture

```
personaliz-video-task/
├── frontend/          # Next.js 14 + TypeScript + MUI
├── backend/           # Express.js + TypeScript + Prisma
├── docker-compose.yml # Multi-service orchestration
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - React component library
- **Emotion** - CSS-in-JS styling

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Axios** - HTTP client

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL** - Database service

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personaliz-video-task
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

## 🔧 Development Setup

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start development server
npm run dev
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 Database Schema

### Users
- User accounts and authentication
- Profile information (name, email, phone)

### Video Requests
- Video generation requests
- Status tracking (pending, processing, completed, failed)
- Metadata and URLs

### WhatsApp Messages
- Message history and delivery status
- Integration with video requests

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/profile` - Get user profile

### Videos
- `GET /api/v1/videos` - Get user's videos
- `POST /api/v1/videos` - Create video request
- `GET /api/v1/videos/:id` - Get specific video
- `POST /api/v1/videos/:id/regenerate` - Regenerate video

### WhatsApp
- `POST /api/v1/whatsapp/send` - Send message
- `POST /api/v1/whatsapp/send-video` - Send video
- `POST /api/v1/whatsapp/webhook` - Webhook endpoint

## 🐳 Docker Services

### PostgreSQL (port 5432)
- Database service with persistent storage
- Health checks and initialization scripts

### Backend (port 3001)
- Express.js API server
- Hot reload in development
- Prisma ORM integration

### Frontend (port 3000)
- Next.js application
- Hot reload in development
- MUI theme integration

## 🔐 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/personalized_video_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# WhatsApp API
WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"

# Video API
VIDEO_API_URL="https://api.example.com/video"
VIDEO_API_KEY="your-video-api-key"
```

## 📱 Frontend Components

### VideoGenerationForm
- Comprehensive form for video creation
- Validation and error handling
- MUI components with custom styling

### Theme Configuration
- Custom MUI theme
- Responsive design
- Dark/light mode support

## 🔄 Workflow

1. **User Registration/Login** - Secure authentication
2. **Video Creation** - Fill out video generation form
3. **AI Processing** - Backend generates video using AI
4. **WhatsApp Delivery** - Video sent via WhatsApp API
5. **Status Tracking** - Real-time updates on progress

## 🚀 Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or build individually
docker-compose build
docker-compose up -d
```

### Environment Configuration

1. Update `.env` with production values
2. Configure database connection
3. Set up WhatsApp API credentials
4. Configure video generation API

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring

- Health check endpoints
- Request logging
- Error tracking
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Roadmap

- [ ] Real-time video preview
- [ ] Advanced video editing
- [ ] Multiple language support
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Video templates
- [ ] Batch processing

