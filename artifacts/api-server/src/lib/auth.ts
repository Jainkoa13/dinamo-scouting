import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.userId) {
    next();
    return;
  }
  res.status(401).json({ error: "No autenticado" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.userId && req.session?.role === "admin") {
    next();
    return;
  }
  res.status(403).json({ error: "Acceso denegado" });
}
