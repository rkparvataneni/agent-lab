import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readPythonLesson(file: string): Promise<string> {
  const full = path.join(process.cwd(), "python", "agentic_lab", "lessons", file);
  return readFile(full, "utf8");
}
