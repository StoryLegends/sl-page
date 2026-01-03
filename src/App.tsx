import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import About from './pages/About';
import Rules from './pages/Rules';
import History from './pages/History';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/about" element={<About />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
