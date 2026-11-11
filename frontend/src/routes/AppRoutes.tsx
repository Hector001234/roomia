import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { PublicLayout } from '../layouts/PublicLayout';
import { HomePage } from '../pages/public/HomePage';
import { LegalNoticePage } from '../pages/public/LegalNoticePage';
import { LoginPage } from '../pages/public/LoginPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { TripsPage } from '../pages/public/TripsPage';
import { WishlistsPage } from '../pages/public/WishlistsPage';

export const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal Experience */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="wishlists" element={<WishlistsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="legal" element={<LegalNoticePage />} />
            <Route path="privacidad" element={<LegalNoticePage />} />
            <Route path="terminos" element={<LegalNoticePage />} />
            <Route path="seguridad-pci" element={<LegalNoticePage />} />
            {/* Catch-all including /admin, returning clean 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
