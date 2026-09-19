import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Agendamento from './pages/Agendamento';
import Cursos from './pages/Cursos';
import CursoOnline from './pages/CursoOnline';
import Entrar from './pages/Entrar';
import MinhaConta from './pages/MinhaConta';
import Admin from './pages/Admin';
import PagamentoRetorno from './pages/PagamentoRetorno';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/curso/:slug" element={<CursoOnline />} />
          <Route path="/aluna/:slug" element={<CursoOnline />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/minha-conta" element={<MinhaConta />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pagamento/retorno" element={<PagamentoRetorno />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
