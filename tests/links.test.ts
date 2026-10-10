import { describe, it, expect } from "vitest";
import {
  api,
  registerUser,
  createLink,
  createCollection,
} from "./helpers";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("POST /api/links", () => {
  it("creates a link for the authenticated user", async () => {
    const { token } = await registerUser();

    const res = await api()
      .post("/api/links")
      .set(auth(token))
      .send({ title: "Node docs", url: "https://nodejs.org" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Node docs" });
    expect(res.body.tags).toEqual([]);
  });

  it("rejects an invalid URL with 400", async () => {
    const { token } = await registerUser();

    const res = await api()
      .post("/api/links")
      .set(auth(token))
      .send({ title: "Bad", url: "not-a-url" });

    expect(res.status).toBe(400);
  });

  it("rejects a request with no token with 401", async () => {
    const res = await api()
      .post("/api/links")
      .send({ title: "x", url: "https://example.com" });

    expect(res.status).toBe(401);
  });

  it("rejects a collection owned by someone else", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const bobsCollection = await createCollection(bob.token);

    const res = await api()
      .post("/api/links")
      .set(auth(alice.token))
      .send({
        title: "Sneaky",
        url: "https://example.com",
        collectionId: bobsCollection.id,
      });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/links", () => {
  it("returns paginated data and meta", async () => {
    const { token } = await registerUser();
    for (let i = 0; i < 3; i++) {
      await createLink(token, { title: `Link ${i}` });
    }

    const res = await api()
      .get("/api/links?page=1&limit=2")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it("filters by search term, case-insensitively", async () => {
    const { token } = await registerUser();
    await createLink(token, { title: "Cybersecurity notes" });
    await createLink(token, { title: "Cooking recipes" });

    const res = await api().get("/api/links?search=cyber").set(auth(token));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Cybersecurity notes");
  });

  it("filters by tag", async () => {
    const { token } = await registerUser();
    const link = await createLink(token);
    await createLink(token, { title: "Other" });
    await api()
      .put(`/api/links/${link.id}/tags`)
      .set(auth(token))
      .send({ tagNames: ["security"] });

    const res = await api().get("/api/links?tag=security").set(auth(token));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(link.id);
  });

  it("filters by collection", async () => {
    const { token } = await registerUser();
    const collection = await createCollection(token);
    await createLink(token, { collectionId: collection.id });
    await createLink(token);

    const res = await api()
      .get(`/api/links?collection=${collection.id}`)
      .set(auth(token));

    expect(res.body.data).toHaveLength(1);
  });

  it("rejects a malformed page parameter with 400", async () => {
    const { token } = await registerUser();

    const res = await api().get("/api/links?page=abc").set(auth(token));

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/links/:id/tags", () => {
  it("replaces the tag set and normalizes names", async () => {
    const { token } = await registerUser();
    const link = await createLink(token);

    const res = await api()
      .put(`/api/links/${link.id}/tags`)
      .set(auth(token))
      .send({ tagNames: ["Security", " OWASP "] });

    expect(res.status).toBe(200);
    expect(res.body.tags.map((t: { name: string }) => t.name).sort()).toEqual([
      "owasp",
      "security",
    ]);
  });

  it("does not let a user tag another user's link", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const alicesLink = await createLink(alice.token);

    const res = await api()
      .put(`/api/links/${alicesLink.id}/tags`)
      .set(auth(bob.token))
      .send({ tagNames: ["hijack"] });

    expect(res.status).toBe(404);
  });
});

describe("ownership (IDOR prevention)", () => {
  it("does not list another user's links", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    await createLink(alice.token);

    const res = await api().get("/api/links").set(auth(bob.token));

    expect(res.body.data).toHaveLength(0);
  });

  it("does not read another user's link", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const alicesLink = await createLink(alice.token);

    const res = await api().get(`/api/links/${alicesLink.id}`).set(auth(bob.token));

    expect(res.status).toBe(404);
  });

  it("does not update another user's link", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const alicesLink = await createLink(alice.token);

    const res = await api()
      .patch(`/api/links/${alicesLink.id}`)
      .set(auth(bob.token))
      .send({ title: "Hijacked" });

    expect(res.status).toBe(404);
  });

  it("does not delete another user's link", async () => {
    const alice = await registerUser("alice", "alice@test.com");
    const bob = await registerUser("bob", "bob@test.com");
    const alicesLink = await createLink(alice.token);

    const res = await api()
      .delete(`/api/links/${alicesLink.id}`)
      .set(auth(bob.token));

    expect(res.status).toBe(404);

    const stillThere = await api()
      .get(`/api/links/${alicesLink.id}`)
      .set(auth(alice.token));
    expect(stillThere.status).toBe(200);
  });
});

describe("PATCH /api/links/:id", () => {
  it("updates only the provided fields", async () => {
    const { token } = await registerUser();
    const link = await createLink(token, {
      description: "keep me",
    });

    const res = await api()
      .patch(`/api/links/${link.id}`)
      .set(auth(token))
      .send({ title: "New title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New title");
    expect(res.body.description).toBe("keep me");
    expect(res.body.url).toBe(link.url);
  });

  it("rejects an empty body with 400", async () => {
    const { token } = await registerUser();
    const link = await createLink(token);

    const res = await api()
      .patch(`/api/links/${link.id}`)
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric id with 400", async () => {
    const { token } = await registerUser();

    const res = await api().get("/api/links/abc").set(auth(token));

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/links/:id", () => {
  it("returns 204 and removes the link", async () => {
    const { token } = await registerUser();
    const link = await createLink(token);

    const res = await api().delete(`/api/links/${link.id}`).set(auth(token));
    expect(res.status).toBe(204);

    const after = await api().get(`/api/links/${link.id}`).set(auth(token));
    expect(after.status).toBe(404);
  });
});

describe("error handling", () => {
  it("returns a consistent shape for unknown routes", async () => {
    const res = await api().get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Route not found" });
  });

  it("does not leak stack traces on malformed JSON", async () => {
    const res = await api()
      .post("/api/links")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("at ");
  });
});