// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Setup from "./pages/Setup.jsx";
import Group from "./pages/Group.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Vocab from "./pages/Vocab.jsx";
import ParentView from "./pages/ParentView.jsx";
import Settings from "./pages/Settings.jsx"; // ✅

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "setup", element: <Setup /> },
      { path: "group/:groupId", element: <Group /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "vocab", element: <Vocab /> },
      { path: "settings", element: <Settings /> },  // ✅
      { path: "p/:studentId", element: <ParentView /> },
    ],
  },
]);
