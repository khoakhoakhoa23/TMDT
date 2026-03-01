import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label="Toggle theme"
    >
      {/* Switch Track Background */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Light Mode Background (Blue) */}
        <div
          className={`absolute inset-0 bg-blue-500 transition-opacity duration-300 ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Dark Mode Background (Gray) */}
        <div
          className={`absolute inset-0 bg-gray-600 transition-opacity duration-300 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Switch Handle with Icons */}
      <div className="relative flex items-center h-full">
        {/* Sun Icon (Light Mode) - Left side with white circle, blue icon */}
        <div
          className={`absolute left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
            isDark
              ? "opacity-0 scale-0 -translate-x-2"
              : "opacity-100 scale-100 translate-x-0"
          }`}
        >
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Moon Icon (Dark Mode) - Right side with white circle, gray icon */}
        <div
          className={`absolute right-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
            isDark
              ? "opacity-100 scale-100 translate-x-0"
              : "opacity-0 scale-0 translate-x-2"
          }`}
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
