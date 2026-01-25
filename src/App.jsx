import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import ProfilePage from './pages/ProfilePage';
import ListsPage from './pages/ListsPage';
import AddPage from './pages/AddPage';
import ArtistPage from './pages/ArtistPage';

function App() {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col lg:flex-row">
        <NavigationBar />
        <main className="flex-1 lg:ml-64 min-h-screen relative z-10 pb-20 lg:pb-0"> {/* Responsive: no margin on mobile, bottom padding for nav */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/item/:id" element={<DetailPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/add" element={<AddPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

