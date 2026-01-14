import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { HomePage } from "./pages/HomePage";
import { SubscribePage } from "./pages/SubscribePage";
import { ContactPage } from "./pages/ContactPage";
import { FlagshipContentsPage } from "./pages/FlagshipContentsPage";
import { FlagshipContentDetailPage } from "./pages/FlagshipContentDetailPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminPostEditorPage } from "./pages/AdminPostEditorPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ScrollToTop } from "./components/ScrollToTop";
import { getUser, removeToken, removeUser, seedDatabase } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize: seed database and restore user session
    const init = async () => {
      // Restore user session from localStorage first (don't wait for backend)
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
      }
      
      // Always set loading to false immediately so app can render
      setLoading(false);
      
      // Try to seed database in background (don't block on it)
      try {
        // Add timeout to prevent hanging
        const seedPromise = seedDatabase();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        await Promise.race([seedPromise, timeoutPromise]);
      } catch (e) {
        // Ignore seed errors - might already be seeded or backend not ready
        console.log('Database seeding skipped or failed:', e.message);
      }
    };
    
    init();
  }, []);

  const handleLogin = (userData) => {
    console.log('handleLogin called with:', userData);
    setUser(userData);
    // Also ensure localStorage is updated (should already be done by authAPI.login)
    if (userData) {
      const storedUser = getUser();
      if (!storedUser || storedUser.id !== userData.id) {
        // Force update from localStorage if there's a mismatch
        setUser(storedUser || userData);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    removeToken();
    removeUser();
  };

  const isLoggedIn = !!user;
  const isSubscribed = user?.is_subscribed || false;
  const isAdmin = user?.is_admin || false;

  if (loading) {
    return <div className="App loading">Loading...</div>;
  }

  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  isLoggedIn={isLoggedIn} 
                  isSubscribed={isSubscribed} 
                  isAdmin={isAdmin}
                  onLogout={handleLogout} 
                />
              } 
            />
            <Route 
              path="/subscribe" 
              element={<SubscribePage onLogin={handleLogin} />} 
            />
            <Route path="/contact" element={<ContactPage />} />
            <Route 
              path="/flagship-contents" 
              element={
                <FlagshipContentsPage 
                  isLoggedIn={isLoggedIn} 
                  isSubscribed={isSubscribed} 
                  isAdmin={isAdmin}
                  onLogout={handleLogout} 
                />
              } 
            />
            <Route 
              path="/flagship-contents/:contentId" 
              element={
                <FlagshipContentDetailPage 
                  isLoggedIn={isLoggedIn} 
                  isSubscribed={isSubscribed} 
                  isAdmin={isAdmin}
                  onLogout={handleLogout} 
                />
              } 
            />
            
            {/* Password Reset Routes */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/login" 
              element={<AdminLoginPage onAdminLogin={handleLogin} />} 
            />
            <Route 
              path="/admin/dashboard" 
              element={<AdminDashboardPage user={user} onAdminLogout={handleLogout} />} 
            />
            <Route 
              path="/admin/posts/new" 
              element={<AdminPostEditorPage user={user} />} 
            />
            <Route 
              path="/admin/posts/edit/:postId" 
              element={<AdminPostEditorPage user={user} />} 
            />
          </Routes>
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default App;
