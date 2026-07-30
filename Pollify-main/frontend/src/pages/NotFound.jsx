import { Link } from "react-router-dom";
import { HiOutlineEmojiSad } from "react-icons/hi";

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <HiOutlineEmojiSad className="text-6xl text-primary-300 mb-4" />
    <h1 className="font-display font-bold text-2xl text-gray-800 mb-2">Page not found</h1>
    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or was moved.</p>
    <Link to="/" className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
