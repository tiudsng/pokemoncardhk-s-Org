import React from 'react';

console.log("TCG Invest Version 2.0 - App.tsx loading...");
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Navbar } from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import { Home } from './Home';
import { CreateWantListing } from './CreateWantListing';
import { CreateListing } from './CreateListing';
import { ListingDetail } from './ListingDetail';
import { ChatList } from './ChatList';
import { ChatDetail } from './ChatDetail';
import { Articles } from './Articles';
import { ArticleDetail } from './ArticleDetail';
import { Profile } from './Profile';
import { AuthPage } from './AuthPage';
import { SearchPage } from './SearchPage';
import { FavoritesPage } from './FavoritesPage';
import { PortfolioPage } from './PortfolioPage';
import { AdminDashboard } from './AdminDashboard';
import MarketPrices from './MarketPrices';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-blue-200 selection:text-blue-900 transition-colors duration-300">
          <Navbar />
          <main className="pb-16 sm:pb-0">
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
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/chats" element={<ChatList />} />
              <Route path="/chat/:id" element={<ChatDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/market" element={<MarketPrices />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
