import { createAuthClient } from 'better-auth/react';

// baseURL relativo: em desenvolvimento o Vite encaminha /api para a porta 3000,
// então o cookie de sessão é de mesma origem e não esbarra em SameSite.
export const auth = createAuthClient({ basePath: '/api/auth' });

export const { useSession, signIn, signUp, signOut } = auth;
