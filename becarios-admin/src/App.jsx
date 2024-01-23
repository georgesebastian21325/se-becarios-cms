import { useState } from 'react';
import {
  Routes,
  Route,
  BrowserRouter,
} from 'react-router-dom';

import './App.css';
import Login from './components/global/LoginForm';
import PageNotFound from './pages/PageNotFound';
import NavBar from './components/global/NavBar';
import NavBarMobile from './components/global/NavBarMobile';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ManageContent from './pages/ManageContent';
import PostArchives from './pages/PostArchives';
import RecentActivities from './pages/RecentActivities';
import CreatePost from './pages/CreatePost';
import { CreatePostProvider } from './hooks/CreatePostContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/create-post"
          element={
            <CreatePostProvider
              value={CreatePostProvider.contextValue}
            >
              <CreatePost />
            </CreatePostProvider>
          }
        />
        <Route
          path="/recent-activities"
          element={<RecentActivities />}
        />
        <Route
          path="/manage-content"
          element={<ManageContent />}
        />
        <Route
          path="/post-archives"
          element={<PostArchives />}
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/sign-out" element={<Login />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
    // <>
    //   <NavBarMobile />
    //   <NavBar />
    //   <Login />
    // </>
  );
}

export default App;
