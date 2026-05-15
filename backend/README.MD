# Directory Structure

1. **node_modules**
   - The directory in Node.js projects that stores all third-party libraries, packages, and dependencies.

2. **src**
   - config
     - Configuration files (DB connection logic).
     - Logic to connect and interact with MongoDB or PostgreSQL.
   - controllers
     - Holds the core logic that processes incoming API requests.
   - middleware
     - Functions that run before the controller (Authentication, validation, logging).
   - models
     - Database Schema Definitions (The structure of your data).
   - routes
     - API Endpoint definitions (What URL maps to what function).
   - index.js
     - Entry point / Server setup.

3. **.env**
   - Environment variables (DB URI, Secret Keys).

4. **package.json**
   - Central identity card or manifest for any Node.js project.
