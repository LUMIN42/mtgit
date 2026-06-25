import {z} from "zod";


export const formats = ["Standard", "Modern", "Commander", "Pauper"] as const;

export const FormatSchema = z.enum(formats);

export type Format = z.infer<typeof FormatSchema>;