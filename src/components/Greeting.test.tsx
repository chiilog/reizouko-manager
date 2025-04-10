import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Greeting } from './Greeting';

describe('Greeting', () => {
  it('renders the correct text', () => {
    render(<Greeting name="Kanna" />);
    expect(screen.getByText('Hello, Kanna!')).toBeInTheDocument();
  });
});
