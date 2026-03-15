# Prompt Verse 🚀

Prompt Verse is a professional-grade, full-stack platform designed for discovering, creating, and managing AI prompts. It serves as a centralized hub for AI enthusiasts to share their best-performing prompts, collaborate through forks, and organize their favorite discoveries into collections.

![Prompt Verse Banner](https://placehold.co/1200x400/1e293b/ffffff?text=Prompt+Verse+Platform)

## ✨ Core Features

### 🔍 Discovery & Exploration

- **Advanced Explore Page:** Search and filter prompts by categories (Coding, Marketing, Image Gen, etc.), tags, and titles.
- **Trending Feed:** Stay updated with the most popular and recently updated prompts from the community.
- **Personalized Feed:** Follow your favorite creators and see their latest prompt engineering masterpieces in a dedicated feed.

### 🛠️ Prompt Lifecycle Management

- **Smart Prompt Editor:** Create complex prompts with support for dynamic variables.
- **Automatic Variable Detection:** Automatically detects and manages variable placeholders as you write your prompts.
- **Prompt Versioning:** Track changes and maintain different versions of your prompts for iterative improvement.
- **Forking System:** Collaboration made easy—fork existing prompts to build upon others' work while maintaining a clear lineage back to the original.

### 📂 Organization & Social

- **Custom Collections:** Organize prompts into private or public collections for better categorisation.
- **Following System:** Build your network by following top prompt engineers.
- **Real-time Notifications:** Get instantly notified of new likes, follows, and forks using high-performance WebSocket integration.
- **Interactive Profiles:** Showcase your portfolio of created prompts, saved items, and social stats.

---

## 🛠️ Technical Architecture

### **Frontend**

- **Framework:** React 19 (Vite)
- **Routing:** TanStack Router (Type-safe routing)
- **State Management:** Redux Toolkit & TanStack Query (Real-time data fetching/caching)
- **Styling:** Tailwind CSS 4.0
- **Authentication:** Clerk (Enterprise-level auth)
- **UI Components:** Framer Motion (Animations), Lucide React (Icons), Sonner (Toasts)
- **Editor:** Monaco Editor integration for professional prompt editing.

### **Backend**

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5.0
- **Database:** MongoDB with Mongoose ODM
- **Security:** Helmet.js, Express-Rate-Limit, CORS
- **File Storage:** Cloudinary integration for handling assets.
- **Auth Middleware:** Clerk SDK for Node.js for secure session validation.

---

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance
- Clerk Account (Publishable & Secret Keys)
- Cloudinary Account (for image uploads)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/prompt-verse.git
    cd prompt-verse
    ```

2. **Setup Backend:**

    ```bash
    cd backend
    npm install
    # Create a .env file based on .env.example
    npm run dev
    ```

3. **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    # Create a .env file based on .env.example
    npm run dev
    ```

---

## 📜 Database Schema Overview

The system uses a robust relational-like structure in MongoDB:

- **`User`**: Extended profiles linked to Clerk auth.
- **`Prompt`**: Core entity with metadata for versioning, variables, and social stats.
- **`Collection`**: Grouping entity for prompt organization.
- **`Follow`/`Notification`**: Social graph and real-time interaction models.

---

## 🗺️ Roadmap

- [ ] WebSocket integration for real-time notifications.
- [ ] Advanced image generation output examples for prompts.
- [ ] Enhanced profile analytics for creators.
- [ ] Global search across categories, tags, and users simultaneously.

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

Built with ❤️ by the Prompt Verse Team.
