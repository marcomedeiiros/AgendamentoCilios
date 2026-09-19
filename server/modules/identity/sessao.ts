import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "./auth";

export type Usuario = { id: string; email: string; nome: string; role: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

/** Lê a sessão do cookie e anexa em req.usuario quando existir. */
export async function carregarSessao(req: Request, _res: Response, next: NextFunction) {
  try {
    const sessao = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (sessao?.user) {
      req.usuario = {
        id: sessao.user.id,
        email: sessao.user.email,
        nome: sessao.user.name,
        role: (sessao.user as { role?: string }).role ?? "user",
      };
    }
  } catch {
    // Sessão inválida ou banco fora do ar: segue como visitante.
  }
  next();
}

export function exigirLogin(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario) {
    res.status(401).json({ erros: ["Entre na sua conta para continuar."] });
    return;
  }
  next();
}

export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.role !== "admin") {
    res.status(403).json({ erros: ["Acesso restrito."] });
    return;
  }
  next();
}
