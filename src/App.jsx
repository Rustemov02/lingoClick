import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookA, Settings } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-md md:max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow">
              <BookA className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              LingoClick
            </h1>
          </Link>
          
          <div className="flex items-center gap-4">
            {!isAdmin ? (
              <Link
                to="/admin"
                className="flex items-center gap-2 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Admin paneli"
              >
                <Settings className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/"
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Tələbə görünüşü
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md md:max-w-4xl mx-auto w-full px-4 md:px-6 pt-6 relative z-10">
        {children}
      </main>
      
      {/* Toast Notifications Provider */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<StudentView />} />
          <Route path="/admin" element={<TeacherView />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}
