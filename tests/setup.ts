import { config } from "dotenv";

// Load test env first, then anything already in the real .env
config({ path: ".env.test" });
config();

// Safety: fail loudly rather than ever running tests against the dev database
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !testUrl.includes("test")) {
  throw new Error(
    "TEST_DATABASE_URL must be set and point at a test database (see .env.test)",
  );
}
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.NODE_ENV = "test";