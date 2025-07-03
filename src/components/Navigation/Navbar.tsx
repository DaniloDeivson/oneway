import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserMenu from '../Layout/UserMenu';
import AuthModal from '../Auth/AuthModal';

export default function Navbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <nav className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Car className="h-8 w-8 text-primary-400" />
              <div className="ml-3">
                <h1 className="text-white font-bold text-lg">OneWay</h1>
                <p className="text-secondary-400 text-sm">Rent A Car</p>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-secondary-800">
                Home
              </Link>
              <Link to="/frota" className="px-3 py-2 rounded-md text-sm font-medium text-secondary-300 hover:text-white hover:bg-secondary-800">
                Frota
              </Link>
              <Link to="/contratos" className="px-3 py-2 rounded-md text-sm font-medium text-secondary-300 hover:text-white hover:bg-secondary-800">
                Contratos
              </Link>
              <Link to="/sobre" className="px-3 py-2 rounded-md text-sm font-medium text-secondary-300 hover:text-white hover:bg-secondary-800">
                Sobre
              </Link>
              <Link to="/contato" className="px-3 py-2 rounded-md text-sm font-medium text-secondary-300 hover:text-white hover:bg-secondary-800">
                Contato
              </Link>
            </div>
          </div>

          {/* User menu or login button */}
          <div className="flex items-center">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Entrar
              </button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800 focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-secondary-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/frota"
              className="block px-3 py-2 rounded-md text-base font-medium text-secondary-300 hover:text-white hover:bg-secondary-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Frota
            </Link>
            <Link
              to="/contratos"
              className="block px-3 py-2 rounded-md text-base font-medium text-secondary-300 hover:text-white hover:bg-secondary-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contratos
            </Link>
            <Link
              to="/sobre"
              className="block px-3 py-2 rounded-md text-base font-medium text-secondary-300 hover:text-white hover:bg-secondary-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              to="/contato"
              className="block px-3 py-2 rounded-md text-base font-medium text-secondary-300 hover:text-white hover:bg-secondary-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contato
            </Link>
            {!user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </nav>
  );
}