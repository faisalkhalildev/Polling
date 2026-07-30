import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

// Each screen is downloaded only when it is opened. In particular, charts and
// the poll-detail screen no longer slow down the initial feed on slow networks.
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Explore = lazy(() => import("./pages/Explore.jsx"));
const CreatePoll = lazy(() => import("./pages/CreatePoll.jsx"));
const PollDetail = lazy(() => import("./pages/PollDetail.jsx"));
const SavedPolls = lazy(() => import("./pages/SavedPolls.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary-50"><div className="h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" /></div>}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="explore" element={<Explore />} />
            <Route path="create" element={<CreatePoll />} />
            <Route path="poll/:id" element={<PollDetail />} />
            <Route path="saved" element={<SavedPolls />} />
            <Route path="profile/:id" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
