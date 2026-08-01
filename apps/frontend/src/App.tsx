import {CustomAppShell} from "./components/CustomAppShell.tsx";
import {Routes, Route, Navigate, useNavigate} from "react-router-dom";

import LoginScreen from "./screens/LoginScreen.tsx";
import RegisterScreen from "./screens/RegisterScreen.tsx";
import DeckSelectionScreen from "./screens/DeckSelectionScreen.tsx";

import {useAuth} from "./hooks/LoginInfo.ts";
import {JSX} from "react";
import React from "react";
import {DeckViewScreenWrapper} from "./screens/DeckViewScreen/DeckViewScreenWrapper.tsx";
import {ScrollToTopButton} from "./components/ScrollToTopButton.tsx";
import {TutorialScreen} from "./screens/TutorialScreen.tsx";

/**
 * 🧠 Auth gate
 */
function RequireAuth({children}: {children: JSX.Element}) {
  const navigate = useNavigate();

  const auth = useAuth();

  if (auth.isLoading) {
    return null;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to={"/login"}/>;
  }

  return children;
}

/**
 * 🚫 Prevent login page if already logged in
 */
function RequireGuest({children}: {children: JSX.Element}) {
  const auth = useAuth();

  if (auth.isLoading) {
    return null;
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/app/decks" replace/>;
  }

  return children;
}

/**
 * 🧱 Layout wrapper
 */
function AppLayout({children}: {children: React.ReactNode}) {
  return <CustomAppShell>{children}</CustomAppShell>;
}

/**
 * 🚀 App
 */
function App() {
  return (
    <>
      <Routes>
        {/* 🔓 LOGIN (ONLY when NOT authenticated) */}
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginScreen/>
            </RequireGuest>
          }
        />

        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterScreen/>
            </RequireGuest>
          }
        />

        {/* 🔐 APP (ONLY when authenticated) */}
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppLayout>
                <Routes>
                  <Route path="decks" element={<DeckSelectionScreen/>}/>
                  <Route path="deck/:deckId/*" element={<DeckViewScreenWrapper/>}/>
                  <Route path="tutorial" element={<TutorialScreen/>}/>
                  <Route path="*" element={<Navigate to="/app/decks" replace/>}/>
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/app/decks" replace/>}/>
      </Routes>
      <ScrollToTopButton/>
    </>

  );
}

export default App;