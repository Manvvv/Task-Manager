# TASKR — Task Manager

A full-stack Task Management application built with **Node.js**, **Express**, and **MongoDB**.

## Features
- ✅ **Full CRUD**: Create, read, update, and delete tasks.
- 🎯 **Priority Levels**: Categorize tasks by High, Medium, or Low priority.
- 📂 **Categories**: Organize tasks into Work, Personal, Study, Health, or General.
- 🔍 **Search & Filter**: Find tasks quickly and filter by status or priority.
- ⚡ **Real-time Stats**: Track your productivity with a live stats dashboard.
- 📱 **Responsive Design**: Clean and functional UI that works on all devices.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Backend**: Node.js & Express API.
- **Database**: MongoDB (via Mongoose).
- **Styling**: Modern CSS with Syne and Space Mono typography.

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/Manvvv/Task-Manager.git
cd Task-Manager
```

Install dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your MongoDB connection string:
```env
MONGO_URI=mongodb://localhost:27017/taskr
PORT=3000
```

### 4. Run the Application
Start the development server:
```bash
npm run dev
```
The app will be available at **http://localhost:3000**.

## Project Structure
- `server.js`: Express server setup and API routes.
- `public/`: Frontend static files (HTML, CSS, JS).
- `models/`: Mongoose schemas for MongoDB.
- `db.js`: Database connection logic.

## License
MIT
