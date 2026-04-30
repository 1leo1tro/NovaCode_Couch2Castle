
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { ShowingNotificationsProvider } from './context/ShowingNotificationsContext';

import Home from './pages/Home';
import Contacts from './pages/Contacts';
import PropertyDetails from './pages/PropertyDetails';
import SignIn from './pages/SignIn';
import Listings from './pages/Listings';
import MyListings from './pages/MyListings';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Showings from './pages/Showings';
import Help from './pages/Help';
import Reports from './pages/Reports';
import Scheduling from './pages/Scheduling';
import CreateUser from './pages/CreateUser';
import Bookmarks from './pages/Bookmarks';
import MyShowings from './pages/MyShowings';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';
import './styles/Navbar.css';


function App() {
  return (
    <Router>
      <AuthProvider>
        <BookmarkProvider>
        <ShowingNotificationsProvider>
        <ThemeProvider>
          <div className="app">
            <Navbar />
            <main className="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/help" element={<Help />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/create-user" element={<CreateUser />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/my-showings" element={<MyShowings />} />
                <Route path="/listings/mine" element={
                  <ProtectedRoute roles={['agent', 'manager', 'admin']}>
                    <MyListings />
                  </ProtectedRoute>
                } />
                <Route path="/listings/create" element={
                  <ProtectedRoute roles={['agent', 'manager', 'admin']}>
                    <CreateListing />
                  </ProtectedRoute>
                } />
                <Route path="/listings/edit/:id" element={
                  <ProtectedRoute roles={['agent', 'manager', 'admin']}>
                    <EditListing />
                  </ProtectedRoute>
                } />
                <Route path="/showings" element={
                  <ProtectedRoute roles={['agent', 'manager', 'admin']}>
                    <Showings />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute roles={['manager', 'admin']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/scheduling" element={
                  <ProtectedRoute roles={['agent', 'manager', 'admin']}>
                    <Scheduling />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
        </ShowingNotificationsProvider>
        </BookmarkProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
