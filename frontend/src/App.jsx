import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/ChatWidget";
import "./styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

// Google Client ID - nên lưu trong .env file
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
// khoangu
// Component chính của app (không có GoogleOAuthProvider)
function AppContent() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <AppRoutes />
            <ChatWidget />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function App() {
  // Chỉ wrap với GoogleOAuthProvider nếu có client_id
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== "") {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppContent />
      </GoogleOAuthProvider>
    );
  }

  // Nếu không có client_id, vẫn render app bình thường (nhưng Google Login sẽ không hoạt động)
  return <AppContent />;
}

export default App;
