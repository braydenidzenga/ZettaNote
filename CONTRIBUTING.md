## Contributing to ZettaNote

🎉 ZettaNote is an open-source note-taking app in active development, and we welcome contributions from everyone! By participating in this project, you agree to abide by its Code of Conduct.

---

### 💡 How to Contribute

We appreciate all forms of contribution, including:

- **Code Contributions:** Implementing new features, fixing bugs, refactoring, and improving performance.
- **Documentation:** Improving existing documentation or adding new guides.
- **Testing:** Writing unit, integration, or end-to-end tests.
- **Feedback & Ideas:** Sharing suggestions for new features or improvements.
- **Reporting Bugs:** Identifying and reporting issues.

#### Reporting Bugs

If you find a bug, please:

1.  Check the existing [Issues] to see if it has already been reported.
2.  If not, open a new **Issue** and use the "Bug Report" template.
3.  Include a clear title, a description of the bug, steps to reproduce it, and your environment details (OS, Node version, etc.).

#### Suggesting Features

If you have an idea for a new feature or improvement:

1.  Check the planned features on [ZettaNote] and the existing [Issues].
2.  If it's new, open a new **Issue** and use the "Feature Request" template.
3.  Describe the feature, why it would be useful, and any potential implementation details you've considered.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

---

### 🔧 Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/braydenidzenga/zettanote.git
   cd ZettaNote/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   # Copy .env.example to .env and fill in your variables
   cp .env.example .env
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

#### 📮 Test APIs with Postman

1. Open **Postman**
2. Click **Import**
3. Select `backend/docs/postman_collection.json`
4. Start testing endpoints (ensure backend is running at `http://localhost:5000`)

---

### 🎨 Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ZettaNote/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Update configuration**

   ```bash
   # Edit config.js to point to your backend instance
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

---

### 💻 Submission Guidelines

When you're ready to contribute code:

1.  **Create a new branch** for your work. Use a descriptive name like `feat/new-feature-name` or `fix/issue-description`.
    ```bash
    git checkout -b your-feature-branch-name
    ```
2.  **Commit your changes** with clear and concise messages.
3.  **Push your branch** to your forked repository.
    ```bash
    git push origin your-feature-branch-name
    ```
4.  **Open a Pull Request (PR)** against the `main` branch of the original `braydenidzenga/zettanote` repository.

**In your Pull Request:**

- Provide a clear title and description of your changes.
- Reference the relevant issue number (e.g., `Fixes #123`).
- Ensure all tests pass (if applicable).
- Be ready to address feedback and make further changes!

## Need Help?

- Check the [README](./README.md) for setup instructions.
- Ask questions or suggest ideas in the Discussions or Issues tab.

---

Thank you for your interest in making ZettaNote better!
