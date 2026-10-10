import request from "supertest";
import { beforeEach, afterAll } from "vitest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

beforeEach(async () => {
  // truncate between tests so each one starts from a known empty state
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Link", "Collection", "Tag", "User" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

export const api = () => request(app);

export async function registerUser(
  username = "alice",
  email = "alice@test.com",
  password = "password123",
) {
  const res = await api()
    .post("/api/auth/register")
    .send({ username, email, password });
  return { id: res.body.id, token: await login(email, password) };
}

export async function login(email: string, password: string) {
  const res = await api().post("/api/auth/login").send({ email, password });
  return res.body.token as string;
}

export async function createLink(token: string, overrides = {}) {
  const res = await api()
    .post("/api/links")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "A link", url: "https://example.com", ...overrides });
  return res.body;
}

export async function createCollection(token: string, overrides = {}) {
  const res = await api()
    .post("/api/collections")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "A collection", ...overrides });
  return res.body;
}