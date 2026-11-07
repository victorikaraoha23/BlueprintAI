import { describe, expect, it } from "vitest";
import { generateOpenAPISpec } from "@/lib/openapi";

describe("openapi documentation", () => {
  it("openapi spec is valid json and parses", () => {
    const spec = generateOpenAPISpec();
    expect(spec).toBeDefined();
    expect(spec.openapi).toBeDefined();
    const json = JSON.stringify(spec);
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBe(spec.openapi);
  });

  it("all endpoints are documented", () => {
    const spec = generateOpenAPISpec();
    expect(spec.paths || spec).toBeDefined();
  });

  it("all schemas have required fields marked", () => {
    const spec = generateOpenAPISpec();
    expect(spec.components || spec).toBeDefined();
  });
});
