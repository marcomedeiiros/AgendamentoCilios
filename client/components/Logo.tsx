import { Link } from 'react-router-dom';
import { site } from '../data/site';

type Props = {
  /** 'dark' = fundo claro (usa a logo). 'light' = fundo escuro (usa o logotipo em texto). */
  tone?: 'dark' | 'light';
};

export default function Logo({ tone = 'dark' }: Props) {
  return (
    <Link to="/" aria-label={`${site.name} — página inicial`} className="inline-flex items-center">
      {tone === 'dark' ? (
        <img
          src="/logo.jpg"
          alt={site.name}
          width={600}
          height={493}
          // A arte vem sobre fundo branco; o multiply apaga esse branco contra
          // o creme do site. Só funciona em fundo claro — daí o logotipo em
          // texto no rodapé escuro.
          className="h-14 w-auto mix-blend-multiply md:h-20"
        />
      ) : (
        <span className="flex flex-col leading-none text-cream">
          <span className="font-display text-3xl italic">Alicia</span>
          <span className="eyebrow mt-1 text-blush-300">Lash Designer</span>
        </span>
      )}
    </Link>
  );
}
