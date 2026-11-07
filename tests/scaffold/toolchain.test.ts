import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("toolchain scaffold", () => {
  it("uses Zod v4 strict parsing and JSON Schema export", () => {
    const schema = z.object({ title: z.string() }).strict();

    expect(schema.safeParse({ title: "Blueprint", extra: true }).success).toBe(
      false,
    );
    expect(schema.safeParse({ title: "Blueprint" }).success).toBe(true);
    expect(typeof z.toJSONSchema).toBe("function");
    expect(z.toJSONSchema(schema)).toMatchObject({ type: "object" });
  });

  it("exposes Drizzle Postgres table builders", () => {
    expect(typeof pgTable).toBe("function");
    expect(typeof uuid).toBe("function");
    expect(typeof text).toBe("function");
  });

  it("exposes the Zod-to-OpenAPI generator", () => {
    expect(typeof OpenApiGeneratorV31).toBe("function");
  });
});
