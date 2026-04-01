import { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Vehicle Monitoring System API",
    version: "1.0.0",
    description: "API documentation for Vehicle Monitoring backend with JWT auth and audit trail"
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      AuditFields: {
        type: "object",
        properties: {
          createdBy: { type: "string", maxLength: 20, example: "admin" },
          createdLocalDateTime: { type: "string", format: "date-time" },
          createdOffset: { type: "string", maxLength: 10, example: "+05:30" },
          createdTimezone: { type: "string", maxLength: 50, example: "Asia/Kolkata" },
          createdUtcDateTime: { type: "string", format: "date-time" },
          modifiedBy: { type: "string", maxLength: 20, nullable: true },
          modifiedLocalDateTime: { type: "string", format: "date-time", nullable: true },
          modifiedOffset: { type: "string", maxLength: 10, nullable: true },
          modifiedTimezone: { type: "string", maxLength: 50, nullable: true },
          modifiedUtcDateTime: { type: "string", format: "date-time", nullable: true }
        }
      },
      Base: {
        allOf: [
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              code: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              isActive: { type: "boolean" }
            }
          },
          { $ref: "#/components/schemas/AuditFields" }
        ]
      },
      User: {
        allOf: [
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              username: { type: "string" },
              displayName: { type: "string" },
              role: { type: "string", enum: ["ADMIN", "OPERATOR"] },
              baseId: { type: "string" },
              failedAttempts: { type: "number" },
              isLocked: { type: "boolean" },
              passcode: { type: "string", nullable: true },
              isActive: { type: "boolean" }
            }
          },
          { $ref: "#/components/schemas/AuditFields" }
        ]
      },
      Vehicle: {
        allOf: [
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              vehicleNumber: { type: "string" },
              type: { type: "string" },
              model: { type: "string" },
              status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
              baseId: { type: "string" }
            }
          },
          { $ref: "#/components/schemas/AuditFields" }
        ]
      },
      VehicleLocation: {
        allOf: [
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              vehicleId: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              speed: { type: "number" },
              locationTime: { type: "string", format: "date-time" }
            }
          },
          { $ref: "#/components/schemas/AuditFields" }
        ]
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: ["src/routes/*.ts"]
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
