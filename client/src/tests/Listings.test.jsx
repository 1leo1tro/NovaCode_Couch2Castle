import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Listings from '../pages/Listings';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('axios');

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

// Suppress CSS import errors in jsdom
vi.mock('../styles/App.css', () => ({}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeListing = (overrides = {}) => ({
  _id: 'listing-1',
  address: '123 Main St',
  zipCode: '12345',
  price: 250000,
  squareFeet: 1500,
  status: 'active',
  beds: 3,
  baths: 2,
  images: [],
  createdBy: { _id: 'agent-1', name: 'Alice Agent', phone: '(555) 000-0001' },
  ...overrides,
});

const renderListings = () =>
  render(
    <MemoryRouter>
      <Listings />
    </MemoryRouter>
  );

const mockAuthUnauthenticated = () =>
  useAuth.mockReturnValue({
    isAuthenticated: () => false,
    user: null,
  });

const mockAuthAuthenticated = (userId = 'agent-1') =>
  useAuth.mockReturnValue({
    isAuthenticated: () => true,
    user: { _id: userId, name: 'Alice Agent' },
  });

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('Listings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUnauthenticated();
  });

  // -------------------------------------------------------------------------
  // Initial render / loading state
  // -------------------------------------------------------------------------

  describe('initial render', () => {
    it('shows loading indicator while fetching', () => {
      // Never resolves during this test
      axios.get.mockReturnValue(new Promise(() => {}));
      renderListings();
      expect(screen.getByText('Loading listings...')).toBeInTheDocument();
    });

    it('fetches /api/listings on mount with no query params', async () => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith('/api/listings')
      );
    });

    it('renders the page heading', async () => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();
      expect(screen.getByRole('heading', { name: /all listings/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Listing cards
  // -------------------------------------------------------------------------

  describe('listing cards', () => {
    it('renders a card for each listing returned by the API', async () => {
      const listings = [
        makeListing({ _id: 'l-1', address: '100 Oak Ave' }),
        makeListing({ _id: 'l-2', address: '200 Pine Rd' }),
      ];
      axios.get.mockResolvedValue({ data: { listings } });
      renderListings();

      await waitFor(() => {
        expect(screen.getByText('100 Oak Ave')).toBeInTheDocument();
        expect(screen.getByText('200 Pine Rd')).toBeInTheDocument();
      });
    });

    it('displays price formatted with commas', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ price: 1250000 })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('$1,250,000')).toBeInTheDocument()
      );
    });

    it('displays ZIP code', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ zipCode: '90210' })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('ZIP: 90210')).toBeInTheDocument()
      );
    });

    it('displays square footage', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ squareFeet: 2200 })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('2200 sqft')).toBeInTheDocument()
      );
    });

    it('displays status badge for non-active listings', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ status: 'pending' })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('pending')).toBeInTheDocument()
      );
    });

    it('does not show status badge for active listings', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ status: 'active' })] },
      });
      renderListings();
      await waitFor(() => screen.getByText('123 Main St'));
      // The word "active" should only appear in the Status row, not as a badge
      const badges = document.querySelectorAll('.property-badge');
      expect(badges.length).toBe(0);
    });

    it('shows agent name from createdBy', async () => {
      axios.get.mockResolvedValue({
        data: {
          listings: [
            makeListing({
              createdBy: { _id: 'a-2', name: 'Bob Broker', phone: '(555) 999-0000' },
            }),
          ],
        },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('Bob Broker')).toBeInTheDocument()
      );
    });

    it('falls back to "Listed by Agent" when createdBy is absent', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ createdBy: null })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('Listed by Agent')).toBeInTheDocument()
      );
    });

    it('renders a Schedule a Tour link pointing to /property/:id', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ _id: 'abc123' })] },
      });
      renderListings();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /schedule a tour/i });
        expect(link).toHaveAttribute('href', '/property/abc123');
      });
    });

    it('shows "No image" placeholder when listing has no images', async () => {
      axios.get.mockResolvedValue({
        data: { listings: [makeListing({ images: [] })] },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('No image')).toBeInTheDocument()
      );
    });
  });

  // -------------------------------------------------------------------------
  // Empty / error states
  // -------------------------------------------------------------------------

  describe('empty and error states', () => {
    it('shows generic empty message when no listings and no filters active', async () => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('No listings found.')).toBeInTheDocument()
      );
    });

    it('shows filter-specific empty message when filters are active and no results', async () => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();

      // Wait for initial load to complete
      await waitFor(() => screen.getByText('No listings found.'));

      // Type in a filter
      const minPriceInput = screen.getByPlaceholderText('Min $');
      await userEvent.type(minPriceInput, '500000');

      await waitFor(() =>
        expect(
          screen.getByText('No listings found matching your criteria.')
        ).toBeInTheDocument()
      );
    });

    it('displays error message when the API call fails', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('Server error')).toBeInTheDocument()
      );
    });

    it('displays fallback error message when no response body', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('Failed to load listings')).toBeInTheDocument()
      );
    });

    it('handles response with missing listings key gracefully (treats as empty)', async () => {
      axios.get.mockResolvedValue({ data: {} });
      renderListings();
      await waitFor(() =>
        expect(screen.getByText('No listings found.')).toBeInTheDocument()
      );
    });
  });

  // -------------------------------------------------------------------------
  // Filter inputs – controlled component behaviour
  // -------------------------------------------------------------------------

  describe('filter inputs', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
    });

    it('renders keyword search input', () => {
      renderListings();
      expect(
        screen.getByPlaceholderText('Address, ZIP code, status')
      ).toBeInTheDocument();
    });

    it('renders minPrice, maxPrice, and zipCode filter inputs', () => {
      renderListings();
      expect(screen.getByPlaceholderText('Min $')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Max $')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ZIP Code')).toBeInTheDocument();
    });

    it('updates keyword filter value as user types', async () => {
      renderListings();
      const input = screen.getByPlaceholderText('Address, ZIP code, status');
      await userEvent.type(input, 'Oak');
      expect(input).toHaveValue('Oak');
    });

    it('updates minPrice filter value as user types', async () => {
      renderListings();
      const input = screen.getByPlaceholderText('Min $');
      await userEvent.type(input, '100000');
      expect(input).toHaveValue(100000);
    });

    it('updates maxPrice filter value as user types', async () => {
      renderListings();
      const input = screen.getByPlaceholderText('Max $');
      await userEvent.type(input, '500000');
      expect(input).toHaveValue(500000);
    });

    it('updates zipCode filter value as user types', async () => {
      renderListings();
      const input = screen.getByPlaceholderText('ZIP Code');
      await userEvent.type(input, '90210');
      expect(input).toHaveValue('90210');
    });
  });

  // -------------------------------------------------------------------------
  // Filter → API integration
  // -------------------------------------------------------------------------

  describe('filter to API integration', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
    });

    it('appends keyword query param when keyword filter is set', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      const input = screen.getByPlaceholderText('Address, ZIP code, status');
      await userEvent.type(input, 'A');

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('keyword=A')
        )
      );
    });

    it('appends minPrice query param when minPrice filter is set', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      const input = screen.getByPlaceholderText('Min $');
      await userEvent.type(input, '1');

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('minPrice=1')
        )
      );
    });

    it('appends maxPrice query param when maxPrice filter is set', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      const input = screen.getByPlaceholderText('Max $');
      await userEvent.type(input, '9');

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('maxPrice=9')
        )
      );
    });

    it('appends zipCode query param when zipCode filter is set', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      const input = screen.getByPlaceholderText('ZIP Code');
      await userEvent.type(input, '9');

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('zipCode=9')
        )
      );
    });

    it('combines multiple active filters into the query string', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      await userEvent.type(screen.getByPlaceholderText('Min $'), '1');
      await userEvent.type(screen.getByPlaceholderText('Max $'), '9');

      await waitFor(() => {
        const calls = axios.get.mock.calls.map((c) => c[0]);
        const combinedCall = calls.find(
          (url) =>
            url.includes('minPrice=1') && url.includes('maxPrice=9')
        );
        expect(combinedCall).toBeDefined();
      });
    });

    it('omits empty filter fields from query string', async () => {
      renderListings();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/listings'));

      // Only type in keyword
      await userEvent.type(
        screen.getByPlaceholderText('Address, ZIP code, status'),
        'X'
      );

      await waitFor(() => {
        const calls = axios.get.mock.calls.map((c) => c[0]);
        const filteredCall = calls.find((url) => url.includes('keyword=X'));
        expect(filteredCall).toBeDefined();
        expect(filteredCall).not.toContain('minPrice');
        expect(filteredCall).not.toContain('maxPrice');
        expect(filteredCall).not.toContain('zipCode');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Authentication – Create Listing button visibility
  // -------------------------------------------------------------------------

  describe('Create Listing button', () => {
    it('is visible when user is authenticated', async () => {
      mockAuthAuthenticated();
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();
      await waitFor(() =>
        expect(
          screen.getByRole('link', { name: /create listing/i })
        ).toBeInTheDocument()
      );
    });

    it('is hidden when user is not authenticated', async () => {
      mockAuthUnauthenticated();
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();
      await waitFor(() => screen.getByText('No listings found.'));
      expect(
        screen.queryByRole('link', { name: /create listing/i })
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Edit / Delete actions – ownership gating
  // -------------------------------------------------------------------------

  describe('Edit and Delete actions', () => {
    const owner = { _id: 'agent-1', name: 'Alice Agent' };
    const listing = makeListing({ _id: 'l-1', createdBy: 'agent-1' });

    it('shows Edit and Delete buttons for the owner of a listing', async () => {
      mockAuthAuthenticated('agent-1');
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /^edit$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });
    });

    it('hides Edit and Delete buttons for non-owners', async () => {
      mockAuthAuthenticated('agent-999'); // different user
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() => screen.getByText('123 Main St'));
      expect(screen.queryByRole('link', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('hides Edit and Delete buttons when unauthenticated', async () => {
      mockAuthUnauthenticated();
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() => screen.getByText('123 Main St'));
      expect(screen.queryByRole('link', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('Edit button links to /listings/edit/:id', async () => {
      mockAuthAuthenticated('agent-1');
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() => {
        const editLink = screen.getByRole('link', { name: /^edit$/i });
        expect(editLink).toHaveAttribute('href', '/listings/edit/l-1');
      });
    });

    it('calls DELETE endpoint and refreshes listings on delete confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      axios.delete = vi.fn().mockResolvedValue({});
      mockAuthAuthenticated('agent-1');
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      );

      await userEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith('/api/listings/l-1')
      );
      // Should re-fetch listings after delete
      expect(axios.get).toHaveBeenCalledTimes(3); // initial + filter effect + post-delete refresh
    });

    it('does not call DELETE when user cancels the confirm dialog', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      axios.delete = vi.fn();
      mockAuthAuthenticated('agent-1');
      axios.get.mockResolvedValue({ data: { listings: [listing] } });
      renderListings();

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      );

      await userEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(axios.delete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Search form behaviour
  // -------------------------------------------------------------------------

  describe('search form', () => {
    it('does not navigate away when Search button is clicked (form submit prevented)', async () => {
      axios.get.mockResolvedValue({ data: { listings: [] } });
      renderListings();

      const form = document.querySelector('form.listings-search-bar');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });
});
