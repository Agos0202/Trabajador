import { render, screen } from '@testing-library/react';
import App from './App';

test('renders worker day title', () => {
  render(<App />);
  const titleElement = screen.getByText(/feliz día del trabajador/i);
  expect(titleElement).toBeInTheDocument();
});
