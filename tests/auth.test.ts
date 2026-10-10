import { describe, it, expect } from "vitest";
import { api, registerUser, login } from "./helpers";

describe("POST /api/auth/register", () => {
  it("creates a user and never returns the password hash", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({
        username: "alice",
        email: "alice@test.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      username: "alice",
      email: "alice@test.com",
    });
    expect(res.body.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser("alice", "taken@test.com");

    const res = await api()
      .post("/api/auth/register")
      .send({
        username: "bob",
        email: "taken@test.com",
        password: "password123",
      });

    expect(res.status).toBe(409);
  });

  it("rejects a duplicate username with 409", async () => {
    await registerUser("alice", "alice@test.com");

    const res = await api()
      .post("/api/auth/register")
      .send({
        username: "alice",
        email: "other@test.com",
        password: "password123",
      });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({
        username: "bob",
        email: "not-an-email",
        password: "password123",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a weak password with 400", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ username: "bob", email: "bob@test.com", password: "short" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    await registerUser("alice", "alice@test.com");

    const res = await api()
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects a wrong password with 401", async () => {
    await registerUser("alice", "alice@test.com");

    const res = await api()
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("gives the same message for unknown email and wrong password", async () => {
    await registerUser("alice", "alice@test.com");

    const wrongPassword = await api()
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "wrongpassword" });
    const unknownEmail = await api()
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user without a password", async () => {
    const { token } = await registerUser("alice", "alice@test.com");

    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.body.password).toBeUndefined();
  });

  it("rejects a request with no token with 401", async () => {
    const res = await api().get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a forged token with 401", async () => {
    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.real.token");

    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const { default: jwt } = await import("jsonwebtoken");
    const forged = jwt.sign({ userId: 1 }, "some-other-secret");

    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});

describe("token handling", () => {
  it("issues a token that works only for its own user", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    await registerUser("bob", "bob@test.com");

    const bobToken = await login("bob@test.com", "password123");
    expect(bobToken).not.toBe(alice.token);

    const asBob = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${bobToken}`);
    expect(asBob.body.username).toBe("bob");
  });
});