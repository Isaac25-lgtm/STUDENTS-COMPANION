import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudyPack from './pages/StudyPack';
import Coursework from './pages/Coursework';
import ResearchBuilderLanding from './pages/ResearchBuilderLanding';
import ProposalBuilder from './pages/research/ProposalBuilderV2';
import ResultsBuilder from './pages/research/ResultsBuilder';
import DiscussionBuilder from './pages/research/DiscussionBuilder';
import DataAnalysisLabLanding from './pages/DataAnalysisLabLanding';
import DataLab from './pages/DataLab';
import QualitativeLab from './pages/QualitativeLab';
import ReportGenerator from './pages/ReportGenerator';
import MockExams from './pages/MockExams';
import Opportunities from './pages/Opportunities';
import Ask from './pages/Ask';
import Credits from './pages/Credits';
import Settings from './pages/Settings';

// Coursework Builder Pages
import CourseworkLanding from './pages/coursework/CourseworkLanding';
import CourseworkGenerator from './pages/coursework/CourseworkGenerator';
import AssignmentAnalysis from './pages/coursework/AssignmentAnalysis';
import WritingInterface from './pages/coursework/WritingInterface';
import ReviewExport from './pages/coursework/ReviewExport';

export default function App() {
  return (
    <Routes>
      {/* Research Builder Section - Full screen pages without Layout wrapper */}
      <Route path="research/proposal" element={<ProposalBuilder />} />
      <Route path="research/results" element={<ResultsBuilder />} />
      <Route path="research/discussion" element={<DiscussionBuilder />} />
      
      {/* Data Analysis Lab - Full screen pages without Layout wrapper */}
      <Route path="data-lab/quantitative" element={<DataLab />} />
      <Route path="data-lab/qualitative" element={<QualitativeLab />} />
      
      {/* Coursework Generator - Full screen pages without Layout wrapper */}
      <Route path="coursework" element={<CourseworkGenerator />} />
      <Route path="coursework/dashboard" element={<Coursework />} />
      <Route path="coursework/new" element={<CourseworkGenerator />} />
      <Route path="coursework/legacy" element={<CourseworkLanding />} />
      <Route path="coursework/analysis/:id" element={<AssignmentAnalysis />} />
      <Route path="coursework/write/:id" element={<WritingInterface />} />
      <Route path="coursework/review/:id" element={<ReviewExport />} />
      
      {/* Pages with Layout wrapper */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study-pack" element={<StudyPack />} />
        <Route path="research" element={<ResearchBuilderLanding />} />
        <Route path="data-lab" element={<DataAnalysisLabLanding />} />
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
