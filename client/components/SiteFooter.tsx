import { Link } from 'react-router-dom';
import { AtSign, Clock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { useConteudo } from '../hooks/useConteudo';

export default function SiteFooter() {
  const { site } = useConteudo();

  return (
    <footer id="contato" className="bg-blush-900 text-blush-100">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-3 md:py-20">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs leading-relaxed text-blush-200/80">
            Studio especializado em design de olhar, com protocolo próprio de higiene e formação
            para novas profissionais desde 2018.
          </p>
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blush-200 transition-colors hover:text-cream"
          >
            <AtSign className="h-4 w-4" aria-hidden="true" />
            @alicialashdesigner__
          </a>
        </div>

        <div>
          <h2 className="eyebrow text-blush-300">Atendimento</h2>
          <ul className="mt-6 space-y-4 text-blush-200/90">
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
              {site.hours}
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
              {site.address}
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
              <a className="transition-colors hover:text-cream" href={`tel:+55${site.phone.replace(/\D/g, '')}`}>
                {site.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
              <a className="transition-colors hover:text-cream" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow text-blush-300">Navegação</h2>
          <ul className="mt-6 space-y-3">
            <li>
              <Link className="text-blush-200/90 transition-colors hover:text-cream" to="/agendamento">
                Agendar horário
              </Link>
            </li>
            <li>
              <Link className="text-blush-200/90 transition-colors hover:text-cream" to="/cursos">
                Cursos e formação
              </Link>
            </li>
            <li>
              <Link className="text-blush-200/90 transition-colors hover:text-cream" to="/#servicos">
                Serviços e valores
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-blush-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-blush-300 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {site.name}. Todos os direitos reservados.</p>
          <p>CNPJ 00.000.000/0001-00</p>
        </div>
      </div>
    </footer>
  );
}
