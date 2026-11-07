import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
});

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Blueprint AI API",
      description: "Blueprint AI backend API",
    },
    servers: [{ url: "/api" }],
    tags: [
      { name: "Projects" },
      { name: "Blueprints" },
      { name: "Research" },
      { name: "Approvals" },
      { name: "Versions" },
    ],
  });
}

export default {
  registry,
  generateOpenAPISpec,
};
