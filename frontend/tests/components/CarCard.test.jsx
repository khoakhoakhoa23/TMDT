import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CarCard from '../../src/components/CarCard';

const mockCar = {
  ma_xe: 'X001',
  ten_xe: 'Test Car',
  gia_thue: 500000,
  mau_sac: 'Đỏ',
  loai_xe: {
    ten_loai: 'SUV'
  },
  image_url: 'https://example.com/car.jpg',
  trang_thai: 'in_stock'
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CarCard Component', () => {
  it('renders car name', () => {
    renderWithRouter(<CarCard car={mockCar} />);
    expect(screen.getByText('Test Car')).toBeInTheDocument();
  });

  it('renders car price', () => {
    renderWithRouter(<CarCard car={mockCar} />);
    expect(screen.getByText(/500,000/i)).toBeInTheDocument();
  });

  it('renders car color', () => {
    renderWithRouter(<CarCard car={mockCar} />);
    expect(screen.getByText(/Đỏ/i)).toBeInTheDocument();
  });

  it('renders car type', () => {
    renderWithRouter(<CarCard car={mockCar} />);
    expect(screen.getByText(/SUV/i)).toBeInTheDocument();
  });

  it('renders car image', () => {
    renderWithRouter(<CarCard car={mockCar} />);
    const image = screen.getByAltText('Test Car');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/car.jpg');
  });
});

