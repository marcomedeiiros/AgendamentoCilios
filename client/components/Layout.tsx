import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function useScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const alvo = document.querySelector(hash);
      if (alvo) {
        alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
}

export default function Layout() {
  useScrollManager();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader />
      <main id="conteudo" className="flex-1 pt-20">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
