import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock contexts
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  })
}));

jest.mock('../contexts/LanguageContext', () => ({
  LanguageProvider: ({ children }) => <div>{children}</div>,
  useLanguage: () => ({
    language: 'en',
    changeLanguage: jest.fn(),
    t: (key) => key
  })
}));

jest.mock('../contexts/CurrencyContext', () => ({
  CurrencyProvider: ({ children }) => <div>{children}</div>,
  useCurrency: () => ({
    currency: 'USD',
    changeCurrency: jest.fn(),
    formatPrice: (price) => `$${price}`
  })
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  trackPageView: jest.fn()
}));

// Mock axios
jest.mock('axios');

describe('Verification Routes', () => {
  it('renders VerifyCertificate page at /verify/certificate', () => {
    render(
      <MemoryRouter initialEntries={['/verify/certificate']}>
        <App />
      </MemoryRouter>
    );
    // The page should render without 404
    expect(screen.getByText('Certificate Verification')).toBeInTheDocument();
  });

  it('renders VerifyCertificate page at /verify/certificate/:id', () => {
    render(
      <MemoryRouter initialEntries={['/verify/certificate/CERT-123']}>
        <App />
      </MemoryRouter>
    );
    // The page should render without 404
    expect(screen.getByText('Certificate Verification')).toBeInTheDocument();
  });

  it('renders VerifyTrainer page at /verify/trainer', () => {
    render(
      <MemoryRouter initialEntries={['/verify/trainer']}>
        <App />
      </MemoryRouter>
    );
    // The page should render without 404
    expect(screen.getByText('Trainer Verification')).toBeInTheDocument();
  });

  it('renders VerifyTrainer page at /verify/trainer/:id', () => {
    render(
      <MemoryRouter initialEntries={['/verify/trainer/TR-123']}>
        <App />
      </MemoryRouter>
    );
    // The page should render without 404
    expect(screen.getByText('Trainer Verification')).toBeInTheDocument();
  });

  it('renders NotFound page for invalid routes', () => {
    render(
      <MemoryRouter initialEntries={['/invalid-route']}>
        <App />
      </MemoryRouter>
    );
    // Should render 404 page
    expect(screen.queryByText('Certificate Verification')).not.toBeInTheDocument();
    expect(screen.queryByText('Trainer Verification')).not.toBeInTheDocument();
  });
});
