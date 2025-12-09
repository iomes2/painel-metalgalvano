import request from "supertest";
// Mock config validation to bypass env var check in CI
jest.mock("../config", () => {
  const actual = jest.requireActual("../config");
  return {
    ...actual,
    validateConfig: jest.fn(),
  };
});

import app from "../app";

describe("Health Check Endpoint", () => {
  it("should return 200 and success message", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "API está funcionando corretamente"
    );
  });
});
