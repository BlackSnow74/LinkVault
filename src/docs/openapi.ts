import { OpenAPIV3 } from "openapi-types";

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
};

const errorResponse = (
  description: string,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "LinkVault API",
    version: "1.0.0",
    description:
      "Personal link/bookmark management API. Save links, organize them into collections and tags, search and filter them, and share collections publicly.",
  },
  servers: [{ url: "/", description: "This server" }],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "array", items: { type: "string" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "alice" },
          email: { type: "string", format: "email", example: "alice@example.com" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Token: {
        type: "object",
        properties: { token: { type: "string" } },
      },
      Link: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Node.js docs" },
          url: { type: "string", example: "https://nodejs.org" },
          description: { type: "string", nullable: true, example: "Official docs" },
          userId: { type: "integer" },
          collectionId: { type: "integer", nullable: true },
          tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
          collection: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", example: "security" },
        },
      },
      Collection: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", example: "reading" },
          visibility: { type: "string", enum: ["PRIVATE", "PUBLIC"] },
          userId: { type: "integer" },
          links: { type: "array", items: { $ref: "#/components/schemas/Link" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LinkPage: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Link" } },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        security: [],
        responses: { "200": { description: "API is running" } },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", minLength: 3, example: "alice" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": errorResponse("Invalid input"),
          "409": errorResponse("Email or username already in use"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Log in and receive a token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Token" },
              },
            },
          },
          "400": errorResponse("Invalid input"),
          "401": errorResponse("Invalid credentials"),
          "429": errorResponse("Rate limit exceeded"),
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Current user",
        responses: {
          "200": {
            description: "Authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": errorResponse("Missing, invalid or expired token"),
        },
      },
    },
    "/api/links": {
      get: {
        summary: "List your links with optional search, filters and pagination",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Case-insensitive match on title, url or description",
          },
          {
            name: "tag",
            in: "query",
            schema: { type: "string" },
            description: "Only links carrying this tag",
          },
          {
            name: "collection",
            in: "query",
            schema: { type: "integer" },
            description: "Only links in this collection",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "A page of links",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LinkPage" },
              },
            },
          },
          "400": errorResponse("Invalid query parameters"),
          "401": errorResponse("Not authenticated"),
        },
      },
      post: {
        summary: "Create a link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "url"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  url: { type: "string", format: "uri" },
                  description: { type: "string", maxLength: 1000 },
                  collectionId: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Link created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Link" } },
            },
          },
          "400": errorResponse("Invalid input"),
          "401": errorResponse("Not authenticated"),
        },
      },
    },
    "/api/links/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      get: {
        summary: "Get one of your links",
        responses: {
          "200": {
            description: "The link",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Link" } },
            },
          },
          "400": errorResponse("Invalid ID format"),
          "404": errorResponse("Not found, or not yours"),
        },
      },
      patch: {
        summary: "Update the fields you provide",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  url: { type: "string", format: "uri" },
                  description: { type: "string", maxLength: 1000 },
                  collectionId: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated link",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Link" } },
            },
          },
          "400": errorResponse("Invalid input"),
          "404": errorResponse("Not found, or not yours"),
        },
      },
      delete: {
        summary: "Delete a link",
        responses: {
          "204": { description: "Deleted" },
          "404": errorResponse("Not found, or not yours"),
        },
      },
    },
    "/api/links/{id}/tags": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      put: {
        summary: "Replace the tag set of a link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tagNames"],
                properties: {
                  tagNames: {
                    type: "array",
                    maxItems: 20,
                    items: { type: "string", maxLength: 50 },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Link with its new tags",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Link" } },
            },
          },
          "400": errorResponse("Invalid input"),
          "404": errorResponse("Not found, or not yours"),
        },
      },
    },
    "/api/collections": {
      get: {
        summary: "List your collections",
        responses: {
          "200": {
            description: "Your collections",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Collection" },
                },
              },
            },
          },
          "401": errorResponse("Not authenticated"),
        },
      },
      post: {
        summary: "Create a collection",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", maxLength: 100 },
                  visibility: { type: "string", enum: ["PRIVATE", "PUBLIC"] },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Collection created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" },
              },
            },
          },
          "400": errorResponse("Invalid input"),
        },
      },
    },
    "/api/collections/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      get: {
        summary: "Get a collection with its links",
        description:
          "Readable without a token when the collection is PUBLIC. Private collections return 404 for everyone but the owner.",
        security: [],
        responses: {
          "200": {
            description: "The collection",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" },
              },
            },
          },
          "404": errorResponse("Not found, private, or not yours"),
        },
      },
      patch: {
        summary: "Update one of your collections",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 100 },
                  visibility: { type: "string", enum: ["PRIVATE", "PUBLIC"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated collection",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" },
              },
            },
          },
          "400": errorResponse("Invalid input"),
          "404": errorResponse("Not found, or not yours"),
        },
      },
      delete: {
        summary: "Delete a collection (its links are kept, unassigned)",
        responses: {
          "204": { description: "Deleted" },
          "404": errorResponse("Not found, or not yours"),
        },
      },
    },
  },
};