# Directory Structure

1. **node_modules**
   - The directory in Node.js projects that stores all third-party libraries, packages, and dependencies.

2. **src**
   - Config
     - Configuration files (DB connection logic).
     - Logic to connect and interact with MongoDB or PostgreSQL.
   - Middleware
     - Functions that run before the controller (Authentication, validation, logging).
   - Models
     - Database Schema Definitions (The structure of your data).
   - Routes
     - API Endpoint definitions (What URL maps to what function).
   - Index.js
     - Entry point / Server setup.

3. **.env**
   - Environment variables (DB URI, Secret Keys).

4. **package.json**
   - Central identity card or manifest for any Node.js project.
