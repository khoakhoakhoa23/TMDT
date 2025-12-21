import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

