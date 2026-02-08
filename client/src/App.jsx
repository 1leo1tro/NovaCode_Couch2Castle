
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Home from './pages/Home';
import Contacts from './pages/Contacts';
import PropertyDetails from './pages/PropertyDetails';
import SignIn from './pages/SignIn';
import Listings from './pages/Listings';
import Navbar from './components/Navbar';
import './styles/App.css';
import './styles/Navbar.css';


function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/listings" element={<Listings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
