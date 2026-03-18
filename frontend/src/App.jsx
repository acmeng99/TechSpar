import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Interview from "./pages/Interview";
import Review from "./pages/Review";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Knowledge from "./pages/Knowledge";
import TopicDetail from "./pages/TopicDetail";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:sessionId" element={<Interview />} />
        <Route path="/review/:sessionId" element={<Review />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/topic/:topic" element={<TopicDetail />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
