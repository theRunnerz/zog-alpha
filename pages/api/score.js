import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'data', 'scores.json');

  if (req.method === 'POST') {
    const { sessionId, score } = req.body;
    
    // Read existing
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Add new
    const newEntry = {
      id: Date.now(),
      sessionId,
      score,
      date: new Date().toISOString()
    };
    data.push(newEntry);
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Find best score for this user
    const userBest = data
      .filter(d => d.sessionId === sessionId)
      .reduce((max, curr) => curr.score > max ? curr.score : max, 0);

    return res.status(200).json({ success: true, best: userBest });
  }

  // Debug Viewer (GET)
  if (req.method === 'GET') {
    const fileData = fs.readFileSync(filePath, 'utf8');
    res.status(200).json(JSON.parse(fileData));
  }
}