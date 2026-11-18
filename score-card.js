/* Score card: a 1080x1350 image of the player's score, drawn on a canvas and
   shared as a picture (or downloaded when the browser cannot share files). */
(() => {
  "use strict";

  const W = 1080;
  const H = 1350;

  const COPY = {
    title: "Word Traps",
    tagline: "French false friends",
    score: "score",
    correct: "correct answers",
    cta: "Can you beat me?",
    url: "wordtraps.com"
  };

  // Draws the card on any 2D context (a real canvas or a recording stub in tests).
  function draw(ctx, options) {
    const o = options || {};
    const score = Math.max(0, Math.floor(Number(o.score) || 0));

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // panel
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(90, 130, W - 180, 760);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.strokeRect(90, 130, W - 180, 760);

    // score
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 56px Inter, Arial, sans-serif";
    ctx.fillText(COPY.score.toUpperCase(), W / 2, 300);
    ctx.font = "800 330px Inter, Arial, sans-serif";
    ctx.fillText(String(score), W / 2, 620);
    if (
      Number.isInteger(o.total) && o.total > 0 &&
      Number.isInteger(o.correct) && o.correct >= 0 && o.correct <= o.total
    ) {
      ctx.font = "700 44px Inter, Arial, sans-serif";
      ctx.fillText(`${o.correct}/${o.total} ${COPY.correct}`, W / 2, 780);
    }

    // texts below the panel
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 76px Inter, Arial, sans-serif";
    ctx.fillText(COPY.cta, W / 2, 1010);
    ctx.font = "700 52px Inter, Arial, sans-serif";
    ctx.fillText(`${COPY.title} - ${COPY.tagline}`, W / 2, 1100);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 46px Inter, Arial, sans-serif";
    ctx.fillText(COPY.url, W / 2, 1200);
    if (o.label) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 44px Inter, Arial, sans-serif";
      ctx.fillText(String(o.label), W / 2, 90);
    }
  }

  function toBlob(options) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      draw(ctx, options);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no image"))), "image/png");
    });
  }

  function fileName(score) {
    return `word-traps-score-${Math.max(0, Math.floor(Number(score) || 0))}.png`;
  }

  function download(blob, name) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  // options: { score, correct, total, label, text }. Shares the picture when the browser
  // can share files, otherwise downloads it.
  async function share(options) {
    const o = options || {};
    const blob = await toBlob(o);
    const name = fileName(o.score);
    try {
      const file = new File([blob], name, { type: "image/png" });
      const data = { files: [file], text: String(o.text || "") };
      if (navigator.canShare && navigator.canShare(data) && navigator.share) {
        await navigator.share(data);
        return "shared";
      }
    } catch (err) {
      if (err && err.name === "AbortError") return "cancelled";
    }
    download(blob, name);
    return "downloaded";
  }

  window.WT_ScoreCard = { W, H, draw, toBlob, share, fileName };
})();
