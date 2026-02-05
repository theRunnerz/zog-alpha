/* pages/api/logs.js */
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Point to the file created by your guardian.js script
  const filePath = path.join(process.cwd(), 'agent', 'agent_logs.json'); 
  
  // Note: We need to modify guardian.js slightly to write a "logs" file 
  // that is easier to read than the "memory" file, or we just read memory.
  // Let's assume we will read the memory file for now.
  const memoryPath = path.join(process.cwd(), 'agent', 'agent_memory.json');

  try {
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, 'utf8');
      const json = JSON.parse(data);
      return res.status(200).json(json);
    } else {
      return res.status(200).json({ handledTx: [] });
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed to read agent memory" });
  }
}