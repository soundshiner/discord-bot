import { z } from "zod";

export const sendPlaylistSchema = z.object({
  playlist: z
    .string({
      required_error: "Playlist URL is required.",
      invalid_type_error: "Playlist URL must be a string.",
    })
    .min(1, "Playlist URL cannot be empty."),

  topic: z
    .string({
      required_error: "Topic is required.",
      invalid_type_error: "Topic must be a string.",
    })
    .min(1, "Topic cannot be empty."),
});
