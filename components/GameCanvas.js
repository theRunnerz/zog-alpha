import { useState, useEffect, useRef } from "react";

export default function GameCanvas({ targetScore }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [roast, setRoast] = useState("");          // ✅ Store AI roast
  const [loadingRoast, setLoadingRoast] = useState(false);

  // Example game logic
  const incrementScore = () => {
    if (!gameOver) setScore(prev => prev + 10);
  };

  const endGame = async () => {
    setGameOver(true);
    setLoadingRoast(true);

    try {
      // Call our roast API
      const aiRes = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, won: targetScore && score > targetScore })
      });

      const aiData = await aiRes.json();
      console.log("ROAST PAYLOAD:", aiData);

      setRoast(aiData.roast || "Coach Zog lost his whistle 🫠");

    } catch (err) {
      console.error("AI Roast Error:", err);
      setRoast("Coach Zog is on a coffee break ☕");
    }

    setLoadingRoast(false);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("Sharing not supported on this device.");
      return;
    }

    if (confirm(`Your score: ${score}\nShare challenge?`)) {
      try {
        await navigator.share({
          title: "Beat my Zog Score!",
          text: `I scored ${score} on Zogs. Can you beat me?`,
          url: window.location.href
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  const handlePlayAgain = () => {
    setScore(0);
    setGameOver(false);
    setRoast("");
  };

  // Example canvas drawing (replace with your real game)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f0";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
  }, [score]);

  return (
    <div style={{ padding: "10px", textAlign: "center" }}>
      <canvas ref={canvasRef} width={300} height={400} style={{ border: "1px solid #333" }} />
      
      {!gameOver && (
        <button
          onClick={incrementScore}
          style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px", borderRadius: "10px" }}
        >
          Hit +10
        </button>
      )}

      {gameOver && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ minHeight: "40px", fontSize: "16px", marginBottom: "10px" }}>
            {loadingRoast ? "Coach Zog is thinking..." : roast}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handlePlayAgain}
              style={{ padding: "10px 20px", fontSize: "16px", borderRadius: "10px", flex: "1 1 40%" }}
            >
              Play Again
            </button>

            <button
              onClick={handleShare}
              style={{ padding: "10px 20px", fontSize: "16px", borderRadius: "10px", flex: "1 1 40%" }}
            >
              Share Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
