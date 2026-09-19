import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Agendamento from './pages/Agendamento';
import Cursos from './pages/Cursos';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/cursos" element={<Cursos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
