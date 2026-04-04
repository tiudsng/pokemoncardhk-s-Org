import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Navbar } from './Navbar';
import { Home } from './Home';
import { Loader2 } from 'lucide-react';

const CreateWantListing = lazy(() => import('./CreateWantListing').then(m => ({ default: m.CreateWantListing })));
const CreateListing = lazy(() => import('./CreateListing').then(m => ({ default: m.CreateListing })));
const ListingDetail = lazy(() => import('./ListingDetail').then(m => ({ default: m.ListingDetail })));
const ChatList = lazy(() => import('./ChatList').then(m => ({ default: m.ChatList })));
const ChatDetail = lazy(() => import('./ChatDetail').then(m => ({ default: m.ChatDetail })));
const Articles = lazy(() => import('./Articles').then(m => ({ default: m.Articles })));
const ArticleDetail = lazy(() => import('./ArticleDetail').then(m => ({ default: m.ArticleDetail })));
const Profile = lazy(() => import('./Profile').then(m => ({ default: m.Profile })));
const AuthPage = lazy(() => import('./AuthPage').then(m => ({ default: m.AuthPage })));
const SearchPage = lazy(() => import('./SearchPage').then(m => ({ default: m.SearchPage })));
const FavoritesPage = lazy(() => import('./FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const PortfolioPage = lazy(() => import('./PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const AdminDashboard = lazy(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EditListing = lazy(() => import('./EditListing').then(m => ({ default: m.EditListing })));
const EditWantListing = lazy(() => import('./EditWantListing').then(m => ({ default: m.EditWantListing })));
const AITestPage = lazy(() => import('./AITestPage').then(m => ({ default: m.AITestPage })));
const AIAssistant = lazy(() => import('./AIAssistant').then(m => ({ default: m.AIAssistant })));
const SellerProfileDemo = lazy(() => import('./SellerProfileDemo').then(m => ({ default: m.SellerProfileDemo })));
const AiAnalysisPage = lazy(() => import('./AiAnalysisPage').then(m => ({ default: m.AiAnalysisPage })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-blue-200 selection:text-blue-900 transition-colors duration-300">
          <Navbar />
          <main className="pb-28 sm:pb-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/article/:id" element={<ArticleDetail />} />
                <Route path="/create" element={<CreateListing />} />
                <Route path="/create-want" element={<CreateWantListing />} />
                <Route path="/edit-listing/:id" element={<EditListing />} />
                <Route path="/edit-want/:id" element={<EditWantListing />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/chats" element={<ChatList />} />
                <Route path="/chat/:id" element={<ChatDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/ai-test" element={<AITestPage />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/ai-scan" element={<AiAnalysisPage />} />
                <Route path="/seller-demo" element={<SellerProfileDemo />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
