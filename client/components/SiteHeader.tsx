import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const links = [
  { to: '/#servicos', label: 'Serviços' },
  { to: '/#studio', label: 'O studio' },
  { to: '/#galeria', label: 'Galeria' },
  { to: '/cursos', label: 'Formação' },
  { to: '/#contato', label: 'Contato' },
];

export default function SiteHeader() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        rolou ? 'border-b border-blush-100 bg-cream/90 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        Ir para o conteúdo
      </a>

      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-9 md:flex" aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-blush-600"
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/agendamento"
            className="rounded-full bg-blush-600 px-6 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-blush-700"
          >
            Agendar
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blush-200 text-ink md:hidden"
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
        >
          {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          className="border-t border-blush-100 bg-cream px-5 pb-6 pt-2 md:hidden"
          aria-label="Navegação principal"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="block border-b border-blush-100/70 py-4 text-base font-medium text-ink"
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/agendamento"
            className="mt-5 block rounded-full bg-blush-600 px-6 py-3 text-center text-sm font-semibold text-cream"
          >
            Agendar horário
          </Link>
        </nav>
      )}
    </header>
  );
}
