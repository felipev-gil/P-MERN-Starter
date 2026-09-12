import { after, before, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { readConfig } from "../config/env.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { hashToken } from "../utils/session.js";
// No dotenv import and no environment URI. Only this owned temporary server is connected.
let database;
let connection;
const origin = "http://localhost:5173";
const config = readConfig({
  NODE_ENV: "test",
  MONGO_URI: "mongodb://127.0.0.1/unused",
  CORS_ORIGINS: origin,
});
let app;
const credentials = {
  name: "Example User",
  email: "example@example.com",
  password: "correct horse battery",
};
const post = (path, body, target = app) =>
  request(target)
    .post("/api/auth/" + path)
    .set("Origin", origin)
    .send(body);
before(async () => {
  database = await MongoMemoryServer.create({
    binary: { version: "7.0.24" },
    instance: { ip: "127.0.0.1", dbName: "starter_isolated_tests" },
  });
  connection = await mongoose.connect(database.getUri(), {
    dbName: "starter_isolated_tests",
  });
  await Promise.all([User.init(), Session.init()]);
});
beforeEach(async () => {
  assert.equal(connection.connection.name, "starter_isolated_tests");
  assert.equal(connection.connection.port, database.instanceInfo.port);
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  app = createApp(config);
});
after(async () => {
  await mongoose.disconnect();
  await database?.stop();
});
test("health reports database readiness and unknown routes use the error envelope", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.data.database, "connected");
  assert.equal(response.headers["cache-control"], "no-store");
  const missing = await request(app).get("/api/missing").expect(404);
  assert.equal(missing.body.error.code, "NOT_FOUND");
});
test("registration hashes the password, sets a private cookie, and allows protected lookup", async () => {
  const response = await post("register", credentials).expect(201);
  assert.deepEqual(Object.keys(response.body.data.user).sort(), [
    "email",
    "id",
    "name",
  ]);
  assert.match(response.headers["set-cookie"][0], /HttpOnly/);
  assert.match(response.headers["set-cookie"][0], /SameSite=Lax/);
  const user = await User.findOne().select("+passwordHash");
  assert.notEqual(user.passwordHash, credentials.password);
  const cookie = response.headers["set-cookie"][0].split(";")[0];
  const token = cookie.split("=")[1];
  assert.equal((await Session.findOne()).tokenHash, hashToken(token));
  const me = await request(app)
    .get("/api/auth/me")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(me.body.data.user.email, credentials.email);
  await post("register", credentials).expect(409);
});
test("login, cookie replacement, logout, replay rejection, and idempotent logout", async () => {
  const registered = await post("register", credentials).expect(201);
  const oldCookie = registered.headers["set-cookie"][0].split(";")[0];
  const loggedIn = await post("login", {
    email: credentials.email.toUpperCase(),
    password: credentials.password,
  })
    .set("Cookie", oldCookie)
    .expect(200);
  const cookie = loggedIn.headers["set-cookie"][0].split(";")[0];
  assert.notEqual(cookie, oldCookie);
  await request(app).get("/api/auth/me").set("Cookie", oldCookie).expect(401);
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(200);
  await post("logout").set("Cookie", cookie).expect(204);
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
  await post("logout").expect(204);
});
test("incorrect password and unknown email return the same safe response", async () => {
  await post("register", credentials).expect(201);
  const wrong = await post("login", {
    ...credentials,
    password: "incorrect-password",
  }).expect(401);
  const unknown = await post("login", {
    ...credentials,
    email: "unknown@example.com",
  }).expect(401);
  assert.deepEqual(wrong.body, unknown.body);
});
test("missing, malformed, expired, and orphaned sessions cannot access protected routes", async () => {
  await request(app).get("/api/auth/me").expect(401);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "mern_session=invalid")
    .expect(401);
  const response = await post("register", credentials).expect(201);
  const cookie = response.headers["set-cookie"][0].split(";")[0];
  await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
  await Session.updateMany({}, { expiresAt: new Date(Date.now() + 60000) });
  await User.deleteMany({});
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
});
test("validation rejects malformed fields and bcrypt truncation without echoing secrets", async () => {
  const response = await post("register", {
    name: "",
    email: "bad",
    password: "short",
  }).expect(422);
  assert.deepEqual(Object.keys(response.body.error.fields).sort(), [
    "email",
    "name",
    "password",
  ]);
  assert.ok(!JSON.stringify(response.body).includes("short"));
  await post("register", { ...credentials, password: "é".repeat(37) }).expect(
    422,
  );
  await post("login", {
    email: { $ne: null },
    password: credentials.password,
  }).expect(422);
  assert.equal(await User.countDocuments(), 0);
});
test("CORS and write origin protection reject untrusted and absent origins", async () => {
  await request(app)
    .get("/api/health")
    .set("Origin", "https://untrusted.example")
    .expect(403);
  await request(app).post("/api/auth/logout").expect(403);
  await request(app)
    .post("/api/auth/register")
    .set("Origin", "https://untrusted.example")
    .send(credentials)
    .expect(403);
  const response = await request(app)
    .options("/api/auth/login")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST")
    .expect(204);
  assert.equal(response.headers["access-control-allow-origin"], origin);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
});
test("JSON errors, oversized bodies, rate limits, and production failures are consistent", async () => {
  const malformed = await request(app)
    .post("/api/auth/login")
    .set("Origin", origin)
    .set("Content-Type", "application/json")
    .send("{")
    .expect(400);
  assert.equal(malformed.body.error.code, "INVALID_JSON");
  await post("login", { padding: "a".repeat(17000) }).expect(413);
  for (let index = 0; index < 20; index++) await post("login", {}).expect(422);
  const limited = await post("login", {}).expect(429);
  assert.equal(limited.body.error.code, "RATE_LIMITED");
  assert.ok(limited.headers["retry-after"]);
  const production = createApp({ ...config, mode: "production" });
  const stub = mock.method(User, "findOne", () => {
    throw new Error("sensitive database information");
  });
  try {
    const response = await post("login", credentials, production).expect(500);
    assert.deepEqual(response.body, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
  } finally {
    stub.mock.restore();
  }
});
test("production cookies use Secure and configured SameSite", async () => {
  const response = await post(
    "register",
    credentials,
    createApp({ ...config, mode: "production", sameSite: "none" }),
  ).expect(201);
  assert.match(response.headers["set-cookie"][0], /Secure/);
  assert.match(response.headers["set-cookie"][0], /SameSite=None/);
});
test("startup configuration fails clearly for invalid values", () => {
  const base = { MONGO_URI: "mongodb://127.0.0.1/test", CORS_ORIGINS: origin };
  for (const change of [
    { MONGO_URI: "" },
    { PORT: "abc" },
    { SESSION_HOURS: "0" },
    { CORS_ORIGINS: "*" },
    { NODE_ENV: "production" },
    { COOKIE_SAME_SITE: "none" },
    { TRUST_PROXY_HOPS: "-1" },
  ])
    assert.throws(
      () => readConfig({ ...base, ...change }),
      /Configuration error:/,
    );
});
