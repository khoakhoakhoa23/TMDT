import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../Footer';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Footer Component', () => {
  it('renders footer with MORENT brand', () => {
    renderWithRouter(<Footer />);
    const brandElement = screen.getByText(/MORENT/i);
    expect(brandElement).toBeInTheDocument();
  });

  it('renders contact information', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/Hotline:/i)).toBeInTheDocument();
    expect(screen.getByText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Giờ làm việc:/i)).toBeInTheDocument();
    expect(screen.getByText(/Địa chỉ:/i)).toBeInTheDocument();
  });

  it('renders social media links', () => {
    renderWithRouter(<Footer />);
    const facebookLink = screen.getByLabelText(/facebook/i);
    const instagramLink = screen.getByLabelText(/instagram/i);
    const twitterLink = screen.getByLabelText(/twitter/i);
    
    expect(facebookLink).toBeInTheDocument();
    expect(instagramLink).toBeInTheDocument();
    expect(twitterLink).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/Về Chúng Tôi/i)).toBeInTheDocument();
    expect(screen.getByText(/Hỗ Trợ/i)).toBeInTheDocument();
    expect(screen.getByText(/Dịch Vụ/i)).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    renderWithRouter(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`©${currentYear}`))).toBeInTheDocument();
  });

  it('has clickable phone and email links', () => {
    renderWithRouter(<Footer />);
    const phoneLink = screen.getByText(/Hotline:/i).closest('a');
    const emailLink = screen.getByText(/Email:/i).closest('a');
    
    expect(phoneLink).toHaveAttribute('href', 'tel:+84123456789');
    expect(emailLink).toHaveAttribute('href', 'mailto:support@morent.com');
  });
});

