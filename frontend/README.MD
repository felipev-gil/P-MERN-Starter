# Directory Structure

1. **node_modules**
   - The directory in Node.js projects that stores all third-party libraries, packages, and dependencies.

2. **public**
   - Stores static assets that don't need processing.

3. **src**
   - components
     - Reusable UI elements like buttons, cards, and navbars.
   - context
     - Files for managing global state using React Context, Redux, or Zustand.
   - hooks
     - Reusable UI elements like buttons, cards, and navbars.
   - pages
     - Route-level components representing entire views.
   - utils
     - General helper functions for things like date formatting or data validation.
   - App.jsx
     - The root component where you typically set up routing and global providers.
   - index.css
     - Global CSS rules that apply to your entire application.
   - main.jsx
     - This is the bridge that connects your React code to your web browser.

4. **.env**
   - Environment variables (DB URI, Secret Keys).

5. **html.index**
   - The main HTML file where the compiled React/Vite app is injected.

6. **package.json**
   - Central identity card or manifest for any Node.js project.
