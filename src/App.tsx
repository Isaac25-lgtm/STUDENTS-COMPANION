import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudyPack from './pages/StudyPack';
import Coursework from './pages/Coursework';
import Research from './pages/Research';
import DataLab from './pages/DataLab';
import ReportGenerator from './pages/ReportGenerator';
import MockExams from './pages/MockExams';
import Opportunities from './pages/Opportunities';
import Ask from './pages/Ask';
import Credits from './pages/Credits';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study-pack" element={<StudyPack />} />
        <Route path="coursework" element={<Coursework />} />
        <Route path="research" element={<Research />} />
        <Route path="data-lab" element={<DataLab />} />
        <Route path="report-generator" element={<ReportGenerator />} />
        <Route path="mock-exams" element={<MockExams />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="ask" element={<Ask />} />
        <Route path="credits" element={<Credits />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

