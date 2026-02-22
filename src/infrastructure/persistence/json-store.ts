import fs from 'fs';
import path from 'path';

export function createJsonStore<T>(filePath: string, defaultData: () => T) {
  function load(): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      console.warn(`[JsonStore] Failed to load from ${filePath}, using defaults`);
    }
    return defaultData();
  }

  function save(data: T): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[JsonStore] Failed to save to ${filePath}:`, e);
    }
  }

  return { load, save };
}
