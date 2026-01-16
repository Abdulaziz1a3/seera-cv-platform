import { render, screen } from '@testing-library/react';
import { SkipLink } from '@/components/accessibility/skip-link';

describe('SkipLink Component', () => {
    it('renders with default text and href', () => {
        render(<SkipLink />);
        const link = screen.getByText('Skip to main content');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '#main-content');
    });

    it('renders with custom text', () => {
        render(<SkipLink>Skip to navigation</SkipLink>);
        expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('renders with custom href', () => {
        render(<SkipLink href="#custom-content">Skip</SkipLink>);
        expect(screen.getByText('Skip')).toHaveAttribute('href', '#custom-content');
    });

    it('is visually hidden by default', () => {
        render(<SkipLink />);
        const link = screen.getByText('Skip to main content');
        expect(link).toHaveClass('sr-only');
    });

    it('becomes visible on focus', () => {
        render(<SkipLink />);
        const link = screen.getByText('Skip to main content');
        expect(link).toHaveClass('focus:not-sr-only');
    });

    it('applies custom className', () => {
        render(<SkipLink className="custom-class">Skip</SkipLink>);
        expect(screen.getByText('Skip')).toHaveClass('custom-class');
    });
});
