# ZettaNote

[![License](https://img.shields.io/github/license/braydenidzenga/zettanote)](./LICENSE)
[![Issues](https://img.shields.io/github/issues/braydenidzenga/zettanote)](https://github.com/yourusername/zettanote/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/braydenidzenga/zettanote)](https://github.com/yourusername/zettanote/pulls)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-blue?style=for-the-badge&logo=github)](https://zettanote.tech)

ZettaNote is an **open-source note-taking app** (in active development) inspired by tools like Notion.  
It focuses on **Markdown-based notes**, **real-time collaboration**, and **flexible organization** while remaining lightweight and developer-friendly.

---

## 🚧 Project Status

This project is currently in the **development phase**.  
Core features are being built and contributions are welcome.

---

## ✨ Planned Features

**Checkout the planned features on [ZettaNote](https://zettanote.tech/share/7ac81567-c0e7-4286-94f7-5596a3fe07a1)**

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Material UI

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/braydenidzenga/zettanote.git

   ```

2. **Install dependencies**

   ```bash
    cd ZettaNote/backend
    npm install

   ```

3. **Setup .env file**

   ```bash
    save a copy of .env.example as ".env" and fill in the variables

   ```

4. **Run the backend**
   ```bash
    npm run dev
   ```

### Frontend Setup

1. **Install dependencies**

   ```bash
   cd ZettaNote/frontend
   npm install

   ```

2. **Edit config.js**

   ```bash
    update the API_URL to point to your backend instance

   ```

3. **Run the frontend**
   ```bash
    npm start
   ```

## Admin portal setup (Not required)

1. **Install dependencies**

   ```bash
      cd admin-portal
      npm i
   ```

2. **Create the .env**
   - copy the .env.example as .env
   - edit the variables inside

3. **Run the admin portal**

   ```bash
      npm start
   ```

4. **Create a default admin user**
   ```bash
      cd ZettaNote/backend
      node createFirstAdmin.js
   ```

## Running with Docker

### Requirements

- Docker
- MongoDB instance (local or cloud)

1. **Clone the repo**

   ```bash
   git clone https://github.com/braydenidzenga/zettanote.git

   ```

2. **Edit variables**

   ```bash
   cd ZettaNote/backend
   modify the variables in the Dockerfile

   cd ZettaNote/frontend
   modify config.js to point to your backend instance

   ```

3. **Build Docker images**

   ```bash
    docker build -t zettanote-backend ./backend
    docker build -t zettanote-frontend ./frontend

   ```

4. **Run Docker containers**
   ```bash
        docker run -d -p PORT:PORT --name zettanote-backend zettanote-backend
        docker run -d -p 3000:3000 --name zettanote-frontend zettanote-frontend
   ```
