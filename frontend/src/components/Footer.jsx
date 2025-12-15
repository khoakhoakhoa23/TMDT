import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white mt-auto transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 dark:text-blue-500 mb-4 transition-colors duration-300">MORENT</h3>
            <p className="text-gray-300 dark:text-gray-400 text-sm mb-4 transition-colors duration-300">
              Our vision is to provide convenience and help increase your sales business.
            </p>
          </div>

          {/* About Column */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 dark:text-gray-300 transition-colors duration-300">About</h4>
            <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
              <li>
                <Link to="/how-it-works" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/featured" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Featured
                </Link>
              </li>
              <li>
                <Link to="/partnership" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Partnership
                </Link>
              </li>
              <li>
                <Link to="/business-relation" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Business Relation
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 dark:text-gray-300 transition-colors duration-300">Socials</h4>
            <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
              <li>
                <Link to="/discord" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Discord
                </Link>
              </li>
              <li>
                <Link to="/instagram" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Instagram
                </Link>
              </li>
              <li>
                <Link to="/twitter" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Twitter
                </Link>
              </li>
              <li>
                <Link to="/facebook" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Facebook
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 dark:text-gray-300 transition-colors duration-300">Community</h4>
            <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
              <li>
                <Link to="/events" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/podcast" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Podcast
                </Link>
              </li>
              <li>
                <Link to="/invite" className="hover:text-white dark:hover:text-gray-200 transition-colors duration-300">
                  Invite a friend
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center transition-colors duration-300">
          <p className="text-sm text-gray-300 dark:text-gray-400 transition-colors duration-300">
            ©2022 MORENT. All rights reserved
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-sm text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors duration-300"
            >
              Privacy & Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors duration-300"
            >
              Terms & Condition
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
