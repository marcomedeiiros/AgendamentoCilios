import { useEffect } from 'react';

/** Mantém título e meta description coerentes em cada rota da SPA. */
export function usePageMeta(titulo: string, descricao?: string) {
  useEffect(() => {
    document.title = titulo;

    if (!descricao) return;
    const tag = document.querySelector('meta[name="description"]');
    if (!tag) return;

    const anterior = tag.getAttribute('content');
    tag.setAttribute('content', descricao);
    return () => {
      if (anterior) tag.setAttribute('content', anterior);
    };
  }, [titulo, descricao]);
}
