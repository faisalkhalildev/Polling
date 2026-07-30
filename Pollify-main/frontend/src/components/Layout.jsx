import Navbar from "./Navbar.jsx";
import { Outlet } from "react-router-dom";

const Layout = ({ children }) => (
  <div className="min-h-screen bg-primary-50">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
      {children ?? <Outlet />}
    </main>
  </div>
);

export default Layout;
