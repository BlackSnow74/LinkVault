import { describe, it, expect } from "vitest";
import { api, registerUser, createLink, createCollection } from "./helpers";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("collection CRUD", () => {
  it("creates a collection as PRIVATE by default", async () => {
    const { token } = await registerUser();

    const res = await api()
      .post("/api/collections")
      .set(auth(token))
      .send({ name: "reading" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "reading", visibility: "PRIVATE" });
  });

  it("rejects an invalid visibility value with 400", async () => {
    const { token } = await registerUser();

    const res = await api()
      .post("/api/collections")
      .set(auth(token))
      .send({ name: "bad", visibility: "SEMI_PUBLIC" });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await api().get("/api/collections");
    expect(res.status).toBe(401);
  });

  it("lists only the caller's collections", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    await createCollection(alice.token, { name: "alice stuff" });
    await createCollection(bob.token, { name: "bob stuff" });

    const res = await api().get("/api/collections").set(auth(alice.token));

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("alice stuff");
  });

  it("includes links in the detail view", async () => {
    const { token } = await registerUser();
    const collection = await createCollection(token);
    await createLink(token, { collectionId: collection.id });

    const res = await api()
      .get(`/api/collections/${collection.id}`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(1);
  });

  it("does not let a user delete another user's collection", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const alices = await createCollection(alice.token);

    const res = await api()
      .delete(`/api/collections/${alices.id}`)
      .set(auth(bob.token));

    expect(res.status).toBe(404);
  });

  it("keeps links when their collection is deleted", async () => {
    const { token } = await registerUser();
    const collection = await createCollection(token);
    const link = await createLink(token, { collectionId: collection.id });

    const del = await api()
      .delete(`/api/collections/${collection.id}`)
      .set(auth(token));
    expect(del.status).toBe(204);

    const after = await api().get(`/api/links/${link.id}`).set(auth(token));
    expect(after.status).toBe(200);
    expect(after.body.collectionId).toBeNull();
  });
});

describe("public collection visibility", () => {
  it("lets a stranger read a PUBLIC collection without a token", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    await createCollection(alice.token, { name: "shared", visibility: "PUBLIC" });

    const res = await api().get("/api/collections/1");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("shared");
  });

  it("hides a PRIVATE collection from strangers with 404", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    await createCollection(alice.token, { name: "secret" });

    const res = await api().get("/api/collections/1");

    expect(res.status).toBe(404);
  });

  it("hides a PRIVATE collection from another logged-in user", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    await createCollection(alice.token, { name: "secret" });

    const res = await api().get("/api/collections/1").set(auth(bob.token));

    expect(res.status).toBe(404);
  });

  it("rejects a stranger modifying a PUBLIC collection", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    await createCollection(alice.token, { name: "shared", visibility: "PUBLIC" });

    const res = await api()
      .patch("/api/collections/1")
      .set(auth(bob.token))
      .send({ name: "hijacked" });

    expect(res.status).toBe(404);
  });

  it("rejects a stranger deleting a PUBLIC collection", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    await createCollection(alice.token, { name: "shared", visibility: "PUBLIC" });

    const res = await api()
      .delete("/api/collections/1")
      .set(auth(bob.token));

    expect(res.status).toBe(404);
  });

  it("still lets the owner read their own PRIVATE collection", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    await createCollection(alice.token, { name: "secret" });

    const res = await api().get("/api/collections/1").set(auth(alice.token));

    expect(res.status).toBe(200);
  });

  it("never exposes a password hash in any response", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    await createCollection(alice.token, { name: "shared", visibility: "PUBLIC" });

    const res = await api().get("/api/collections/1");

    expect(JSON.stringify(res.body)).not.toContain("$2");
  });
});