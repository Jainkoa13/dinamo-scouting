import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/remove-bg", async (req, res): Promise<void> => {
  const { imageData } = req.body as { imageData?: string };

  if (!imageData) {
    res.status(400).json({ error: "imageData requerido" });
    return;
  }

  const apiKey = process.env["REMOVEBG_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "REMOVEBG_API_KEY no configurada" });
    return;
  }

  const base64 = imageData.replace(/^data:image\/[a-z+]+;base64,/, "");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_file_b64: base64, size: "auto" }),
  });

  if (!response.ok) {
    const text = await response.text();
    req.log.warn({ status: response.status, text }, "remove.bg error");
    res.status(response.status).json({ error: text });
    return;
  }

  const buffer = await response.arrayBuffer();
  const result = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
  res.json({ result });
});

export default router;
