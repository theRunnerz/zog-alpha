// components/ScoreGauge.js
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function ScoreGauge({ score }) {
  const data = [{ name: 'Score', value: score, fill: score > 70 ? '#4ade80' : score > 40 ? '#facc15' : '#ef4444' }];

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" barSize={15} data={data} startAngle={180} endAngle={0}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background clockWise dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-xs text-gray-400 uppercase tracking-widest">OVR</span>
      </div>
    </div>
  );
}