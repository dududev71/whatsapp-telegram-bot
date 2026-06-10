import "dotenv/config";
import { z } from "zod";

const schemaEnv = z.object({
  DATABASE_URL: z.string().min(10),
});
export const env = schemaEnv.parse(process.env);
