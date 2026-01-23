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
      <div className="App bg-gray-800 text-white min-h-screen flex">
        <NavigationBar />
        <main className="flex-1 ml-64 p-8"> {/* Add margin-left to account for sidebar and padding for content */}
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

