import { Link } from 'react-router-dom';

type Props = {
  tone?: 'dark' | 'light';
};

export default function Logo({ tone = 'dark' }: Props) {
  const text = tone === 'dark' ? 'text-ink' : 'text-cream';
  const mark = tone === 'dark' ? 'text-blush-500' : 'text-blush-300';

  return (
    <Link to="/" className={`group inline-flex items-baseline gap-2 ${text}`} aria-label="Lash&Co Studio página inicial">
      <span className="font-display text-2xl font-semibold tracking-tight">Lash&amp;Co</span>
      <span className={`eyebrow ${mark} translate-y-[-2px]`}>Studio</span>
    </Link>
  );
}
