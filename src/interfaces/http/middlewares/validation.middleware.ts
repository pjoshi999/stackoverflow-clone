import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware to validate request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 */
export const validate =
  (schema: z.ZodSchema, source: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (result.success) {
      // Replace the original data with validated data
      req[source] = result.data;
      next();
    } else {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
  };
