import { Link } from 'react-router-dom';
import { site } from '../data/site';

type Props = {
  /** 'dark' = fundo claro (usa a logo). 'light' = fundo escuro (usa o logotipo em texto). */
  tone?: 'dark' | 'light';
};

export default function Logo({ tone = 'dark' }: Props) {
  return (
    <Link to="/" aria-label={`${site.name} página inicial`} className="inline-flex items-center">
      {tone === 'dark' ? (
        <img
          src="/logo.png"
          alt={site.name}
          width={298}
          height={245}
          className="h-14 w-auto md:h-20"
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
