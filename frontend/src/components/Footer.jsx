import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">MORENT</h3>
            <p className="text-gray-400 text-sm mb-4">
              Our vision is to provide convenience and help increase your sales business.
            </p>
          </div>

          {/* About Column */}
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/featured" className="hover:text-white transition-colors">
                  Featured
                </Link>
              </li>
              <li>
                <Link to="/partnership" className="hover:text-white transition-colors">
                  Partnership
                </Link>
              </li>
              <li>
                <Link to="/business-relation" className="hover:text-white transition-colors">
                  Business Relation
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h4 className="font-semibold mb-4">Socials</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/discord" className="hover:text-white transition-colors">
                  Discord
                </Link>
              </li>
              <li>
                <Link to="/instagram" className="hover:text-white transition-colors">
                  Instagram
                </Link>
              </li>
              <li>
                <Link to="/twitter" className="hover:text-white transition-colors">
                  Twitter
                </Link>
              </li>
              <li>
                <Link to="/facebook" className="hover:text-white transition-colors">
                  Facebook
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/podcast" className="hover:text-white transition-colors">
                  Podcast
                </Link>
              </li>
              <li>
                <Link to="/invite" className="hover:text-white transition-colors">
                  Invite a friend
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            ©2022 MORENT. All rights reserved
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Privacy & Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-400 hover:text-white transition-colors"
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
