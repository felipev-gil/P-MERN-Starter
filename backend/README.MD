# Backend Directory Structure

## node_modules

Stores all installed third-party packages and dependencies.

## src

### config

Application configuration such as database connections and external services.

### controllers

Business logic that handles incoming requests and generates responses.

### middlewares

Functions executed before controllers, such as authentication, validation, and error handling.

### models

Database schemas and data models.

### routes

API endpoint definitions that map URLs to controllers.

### tests

Automated tests using Jest and Supertest.

### utils

Reusable helper functions and utility classes.

### validators

Request validation rules using Express Validator.

## .env

Backend environment variables.

Example:

```env
MONGO_URI=
JWT_SECRET=
CORS_ORIGIN=
```

## index.js

Application entry point responsible for starting the server.

## package.json

Project metadata, scripts, and dependency definitions.
