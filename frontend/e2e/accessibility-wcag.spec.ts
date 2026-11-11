/**
 * Section 28 & CAL-016 Compliance:
 * WCAG 2.1 Level AA Automated Accessibility Verification Specification (Axe-core / Lighthouse CI)
 */

export interface WcagControlCheck {
  criterionId: string;
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  componentVerified: string;
  auditRule: string;
}

export const WCAG_21_AA_CONTROLS: WcagControlCheck[] = [
  {
    criterionId: 'WCAG 1.1.1 (Non-text Content)',
    principle: 'Perceivable',
    componentVerified: 'PropertyCard.tsx & listing_photos.alt_text',
    auditRule: '100% of S3 WebP property images enforce non-empty descriptive alt attribute',
  },
  {
    criterionId: 'WCAG 1.4.3 (Contrast Minimum >= 4.5:1)',
    principle: 'Perceivable',
    componentVerified: 'RegisterForm.tsx, SearchFilters.tsx, AdminLogs.tsx',
    auditRule: 'Foreground/background color pairs exceed 4.5:1 for normal text and 3:1 for large text',
  },
  {
    criterionId: 'WCAG 2.1.2 (No Keyboard Trap)',
    principle: 'Operable',
    componentVerified: 'BookingModal.tsx & CheckoutModal.tsx',
    auditRule: 'Modal dialogs support Escape key dismissal and focus ring visibility (focus:outline-2)',
  },
  {
    criterionId: 'WCAG 3.3.1 & 3.3.2 (Error Identification & Labels)',
    principle: 'Understandable',
    componentVerified: 'RegisterForm.tsx, CreateListing.tsx, ReviewForm.tsx',
    auditRule: 'Every input has an explicit <label htmlFor="..."> and reactive aria-live="assertive" alerts',
  },
  {
    criterionId: 'WCAG 4.1.2 (Name, Role, Value)',
    principle: 'Robust',
    componentVerified: 'BookingModal.tsx & AdminLogs.tsx',
    auditRule: 'Valid WAI-ARIA attributes (role="dialog", aria-modal="true", role="status")',
  },
];
