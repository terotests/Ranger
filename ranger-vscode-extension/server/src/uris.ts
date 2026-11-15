/** file:// URIs to paths and back, without pulling in vscode-uri. */
import { fileURLToPath, pathToFileURL } from "url";

export function URI_TO_PATH(uri: string): string | null {
  if (!uri.startsWith("file:")) return null;
  try {
    return fileURLToPath(uri);
  } catch {
    return null;
  }
}

export function PATH_TO_URI(file: string): string {
  return pathToFileURL(file).toString();
}
