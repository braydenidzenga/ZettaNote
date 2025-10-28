import request from "supertest";
import app from "../server.js"; // ✅ make sure path is correct

let server;

beforeAll(async () => {
  // Start the server before running tests (but don’t use .listen() again)
  server = app;
});

afterAll(async () => {
  // Close any active connections
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }

  // Close mongoose connection if it exists
  try {
    const mongoose = (await import("mongoose")).default;
    await mongoose.connection.close();
  } catch (err) {
    // ignore if mongoose not connected
  }
});

describe("ZettaNote Backend - Health Check API", () => {
  it("should return 200 and success message from /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});
