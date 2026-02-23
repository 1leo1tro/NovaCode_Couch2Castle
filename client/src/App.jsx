
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';
import Contacts from './pages/Contacts';
import PropertyDetails from './pages/PropertyDetails';
import SignIn from './pages/SignIn';
import Listings from './pages/Listings';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Showings from './pages/Showings';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';
import './styles/Navbar.css';


function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/create" element={
                <ProtectedRoute requireAgent={true}>
                  <CreateListing />
                </ProtectedRoute>
              } />
              <Route path="/listings/edit/:id" element={<EditListing />} />
              <Route path="/showings" element={
                <ProtectedRoute requireAgent={true}>
                  <Showings />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
