# Frontend Directory Structure

## node_modules

Stores all installed third-party packages and dependencies.

## src

### assets

Static resources such as images, icons, and fonts.

### components

Reusable UI elements such as buttons, cards, modals, and navigation bars.

### context

Global state management using React Context.

### hooks

Custom React hooks that encapsulate reusable logic.

### pages

Route-level components representing complete application views.

### services

Handles business logic, state management, and external API requests.

### utils

Reusable helper functions and utility logic.

### App.jsx

Root application component where routes and global providers are configured.

### index.css

Global styles applied across the application.

### main.jsx

Application entry point. Mounts React into the DOM and renders the application.

## .env

Frontend environment variables.

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

## index.html

Main HTML document used by Vite to load the React application.

## package.json

Project metadata, scripts, and dependency definitions.
