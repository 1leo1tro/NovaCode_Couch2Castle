import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import PropertyDetails from '../pages/PropertyDetails';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('axios');

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../styles/PropertyDetails.css', () => ({}));

import { useAuth } from '../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const LISTING_ID = 'aaa111bbb222ccc333ddd444';

const MOCK_PROPERTY = {
  _id: LISTING_ID,
  address: '456 Elm St, Huntsville, AL',
  zipCode: '35802',
  price: 350000,
  squareFeet: 2000,
  status: 'active',
  images: [],
  createdBy: {
    _id: 'agent-abc',
    name: 'Bob Broker',
    email: 'bob@realty.com',
    phone: '(555) 999-0001',
  },
};

// A future date as a datetime-local string (YYYY-MM-DDTHH:MM)
const FUTURE_DATE_LOCAL = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 16);
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderPropertyDetails = (listingId = LISTING_ID) =>
  render(
    <MemoryRouter initialEntries={[`/property/${listingId}`]}>
      <Routes>
        <Route path="/property/:id" element={<PropertyDetails />} />
      </Routes>
    </MemoryRouter>
  );

const mockAuthUnauthenticated = () =>
  useAuth.mockReturnValue({ isAuthenticated: () => false, user: null });

// Waits until the loading indicator disappears
const waitForPropertyLoad = () =>
  waitFor(() =>
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  );

// Sets a controlled form input's value via fireEvent.change, which React
// reads from e.target.name / e.target.value in the onChange handler.
const setField = (element, name, value) => {
  fireEvent.change(element, { target: { name, value } });
};

// Fills all required tour-form fields. Pass overrides to test specific values.
// Use `null` to skip a field entirely (leaves it at the default empty state).
const fillTourForm = ({
  name = 'Jane Visitor',
  email = 'jane@example.com',
  phone = '555-987-6543',
  preferredDate = FUTURE_DATE_LOCAL,
  message = null,
} = {}) => {
  if (name !== null)
    setField(screen.getByPlaceholderText('Your name'), 'name', name);
  if (email !== null)
    setField(screen.getByPlaceholderText('you@example.com'), 'email', email);
  if (phone !== null)
    setField(screen.getByPlaceholderText('(555) 123-4567'), 'phone', phone);
  if (preferredDate !== null) {
    const dateInput = document.querySelector('input[type="datetime-local"]');
    setField(dateInput, 'preferredDate', preferredDate);
  }
  if (message !== null)
    setField(
      screen.getByPlaceholderText('Any questions or special requests?'),
      'message',
      message
    );
};

// Submits the tour form synchronously without waiting for async handlers.
// Use this instead of `await userEvent.click(submitButton)` for tests that
// involve async submission (rejected mocks, pending promises) to avoid
// act() timeouts caused by userEvent v14 wrapping clicks in React's act().
const submitTourForm = () =>
  fireEvent.submit(document.querySelector('form.tour-form'));

// Mock a successful POST /api/showings response
const mockPostSuccess = () =>
  axios.post.mockResolvedValue({
    data: {
      message: 'Showing request submitted successfully',
      showing: { _id: 'showing-xyz', status: 'pending' },
    },
  });

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('PropertyDetails – Schedule a Tour Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUnauthenticated();
    // Default: successful property fetch
    axios.get.mockResolvedValue({ data: { listing: MOCK_PROPERTY } });
  });

  // ── Page Loading States ──────────────────────────────────────────────────

  describe('Page Loading States', () => {
    it('shows a loading indicator while the property is being fetched', () => {
      axios.get.mockReturnValue(new Promise(() => {})); // never resolves
      renderPropertyDetails();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('fetches the property from /api/listings/:id on mount', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(axios.get).toHaveBeenCalledWith(`/api/listings/${LISTING_ID}`);
    });

    it('renders the property address after a successful fetch', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(screen.getByText(MOCK_PROPERTY.address)).toBeInTheDocument();
    });

    it('shows an error message when the property fetch fails with a server message', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Listing not found' } },
      });
      renderPropertyDetails();
      await waitFor(() =>
        expect(screen.getByText(/listing not found/i)).toBeInTheDocument()
      );
    });

    it('shows a fallback error when the fetch fails with no response body', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      renderPropertyDetails();
      await waitFor(() =>
        expect(
          screen.getByText(/failed to load property details/i)
        ).toBeInTheDocument()
      );
    });
  });

  // ── Form Rendering ───────────────────────────────────────────────────────

  describe('Form Rendering', () => {
    it('renders the "Schedule a Tour" heading', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(
        screen.getByRole('heading', { name: /schedule a tour/i })
      ).toBeInTheDocument();
    });

    it('renders the Name input', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('renders the Email input', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders the Phone input', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
    });

    it('renders the Preferred Date datetime-local input', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(
        document.querySelector('input[type="datetime-local"]')
      ).toBeInTheDocument();
    });

    it('renders the Message textarea', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(
        screen.getByPlaceholderText('Any questions or special requests?')
      ).toBeInTheDocument();
    });

    it('renders the "Request Tour" submit button', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(
        screen.getByRole('button', { name: /request tour/i })
      ).toBeInTheDocument();
    });

    it('submit button is enabled when the form is first shown', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      expect(
        screen.getByRole('button', { name: /request tour/i })
      ).not.toBeDisabled();
    });
  });

  // ── Client-side Validation ───────────────────────────────────────────────

  describe('Client-side Validation', () => {
    it('shows "Name is required" when name is empty on submit', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('shows "Email is required" when email is empty on submit', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('shows "Phone number is required" when phone is empty on submit', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    it('shows "Preferred date is required" when date is empty on submit', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(screen.getByText('Preferred date is required')).toBeInTheDocument();
    });

    it('does not call the API when required fields are missing', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('does not call the API when only some required fields are filled', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      // Only fill name; email, phone, date remain empty
      fillTourForm({ email: null, phone: null, preferredDate: null });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('shows an error for a phone number containing letters', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ phone: 'abc-not-phone' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(
        screen.getByText('Please provide a valid phone number')
      ).toBeInTheDocument();
    });

    it('shows an error when preferred date is in the past', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      fillTourForm({ preferredDate: yesterday.toISOString().slice(0, 16) });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(
        screen.getByText('Preferred date must be in the future')
      ).toBeInTheDocument();
    });

    it('shows an error when name is shorter than 2 characters', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ name: 'X' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(
        screen.getByText('Name must be at least 2 characters')
      ).toBeInTheDocument();
    });

    it('shows an error when the message exceeds 1000 characters', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      // Use setField directly to avoid 1001-keystroke timeout
      setField(
        screen.getByPlaceholderText('Any questions or special requests?'),
        'message',
        'A'.repeat(1001)
      );
      fillTourForm({ message: null }); // fill remaining fields without message
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(
        screen.getByText('Message must not exceed 1000 characters')
      ).toBeInTheDocument();
    });

    it('clears the field error when the user types in that field', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      // Trigger validation errors
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      // Simulating a change on the name field should clear its error
      setField(screen.getByPlaceholderText('Your name'), 'name', 'J');
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('only clears the error for the field that changed', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      // Change name field → name error clears but email error persists
      setField(screen.getByPlaceholderText('Your name'), 'name', 'Jane');
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  // ── Form Data Serialization and Transmission ─────────────────────────────

  describe('Form Data Serialization and Transmission', () => {
    it('sends a POST request to /api/showings on valid submission', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith('/api/showings', expect.any(Object))
      );
    });

    it('includes the listing ID (from the route :id param) in the request body', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ listing: LISTING_ID })
        )
      );
    });

    it('serializes the preferred date as an ISO 8601 string', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ preferredDate: FUTURE_DATE_LOCAL });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      // The component converts via new Date(value).toISOString()
      const expectedIso = new Date(FUTURE_DATE_LOCAL).toISOString();
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ preferredDate: expectedIso })
        )
      );
    });

    it('trims whitespace from name before sending', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      // Name validation uses .trim() so leading/trailing spaces are fine
      fillTourForm({ name: '  Jane Visitor  ' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ name: 'Jane Visitor' })
        )
      );
    });

    it('trims whitespace from phone before sending', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      // Phone regex allows \s (whitespace), so spaces pass validation
      fillTourForm({ phone: '  555-987-6543  ' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ phone: '555-987-6543' })
        )
      );
    });

    it('sends an empty string for message when no message is entered', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm(); // message is null → not set → stays ''
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ message: '' })
        )
      );
    });

    it('sends the complete correct payload for a full valid submission', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({
        name: 'Jane Visitor',
        email: 'jane@example.com',
        phone: '555-987-6543',
        preferredDate: FUTURE_DATE_LOCAL,
        message: 'I would love to see the backyard.',
      });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      const expectedIso = new Date(FUTURE_DATE_LOCAL).toISOString();
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith('/api/showings', {
          listing: LISTING_ID,
          name: 'Jane Visitor',
          email: 'jane@example.com',
          phone: '555-987-6543',
          preferredDate: expectedIso,
          message: 'I would love to see the backyard.',
        })
      );
    });

    it('accepts phone formats with hyphens', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ phone: '555-123-4567' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ phone: '555-123-4567' })
        )
      );
    });

    it('accepts phone formats with parentheses and spaces', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ phone: '(555) 123-4567' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          '/api/showings',
          expect.objectContaining({ phone: '(555) 123-4567' })
        )
      );
    });
  });

  // ── Happy Path – Successful Submission ──────────────────────────────────

  describe('Happy Path – Successful Submission', () => {
    beforeEach(() => {
      mockPostSuccess();
    });

    it('shows the success alert after a successful submission', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(
          screen.getByText(/tour request submitted successfully/i)
        ).toBeInTheDocument()
      );
    });

    it('mentions the agent will contact the user in the success message', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(
          screen.getByText(/listing agent will contact you/i)
        ).toBeInTheDocument()
      );
    });

    it('clears the Name field after a successful submission', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ name: 'Jane Visitor' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        screen.getByText(/tour request submitted successfully/i)
      );
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('');
    });

    it('clears the Email field after a successful submission', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ email: 'jane@example.com' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        screen.getByText(/tour request submitted successfully/i)
      );
      expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('');
    });

    it('clears the Phone field after a successful submission', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ phone: '555-987-6543' });
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        screen.getByText(/tour request submitted successfully/i)
      );
      expect(screen.getByPlaceholderText('(555) 123-4567')).toHaveValue('');
    });

    it('re-enables the submit button after a successful submission', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /request tour/i })
        ).not.toBeDisabled()
      );
    });

    it('success alert can be manually closed with the × button', async () => {
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      await userEvent.click(screen.getByRole('button', { name: /request tour/i }));
      await waitFor(() =>
        screen.getByText(/tour request submitted successfully/i)
      );
      const closeBtn = screen.getByRole('button', { name: /close success message/i });
      await userEvent.click(closeBtn);
      expect(
        screen.queryByText(/tour request submitted successfully/i)
      ).not.toBeInTheDocument();
    });

    it('auto-dismisses the success alert after 5 seconds', async () => {
      vi.useFakeTimers();
      try {
        renderPropertyDetails();
        // Flush microtasks so the property fetch promise resolves
        await act(async () => {});
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

        fillTourForm();
        // Use fireEvent.submit to avoid userEvent's act() advancing fake timers,
        // which would fire the 5s dismiss timer before we can assert the message.
        fireEvent.submit(document.querySelector('form.tour-form'));
        // Flush the post promise microtasks and resulting state updates
        await act(async () => {});

        expect(
          screen.getByText(/tour request submitted successfully/i)
        ).toBeInTheDocument();

        // Advance the 5-second auto-dismiss timer
        act(() => vi.advanceTimersByTime(5000));

        expect(
          screen.queryByText(/tour request submitted successfully/i)
        ).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ── Error Scenarios ──────────────────────────────────────────────────────
  //
  // These tests use submitTourForm() (fireEvent.submit) instead of
  // `await userEvent.click()` because userEvent v14 wraps clicks in React's
  // act(), which tries to flush ALL pending async work. For mockRejectedValue
  // and never-resolving Promises, act() either times out or hangs indefinitely.
  // fireEvent.submit is synchronous and does not wait for async handlers.

  describe('Error Scenarios', () => {
    it('shows an error alert when the API returns a 400 validation error', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Preferred date must be in the future' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(
          screen.getByText('Preferred date must be in the future')
        ).toBeInTheDocument()
      );
    });

    it('shows an error alert when the API returns a 404 (listing not found)', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Listing not found' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Listing not found')).toBeInTheDocument()
      );
    });

    it('shows an error alert when the API returns a 500 server error', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Internal server error' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Internal server error')).toBeInTheDocument()
      );
    });

    it('shows a fallback error when the API error has no response body', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(
          screen.getByText(/failed to submit showing request/i)
        ).toBeInTheDocument()
      );
    });

    it('does not show a success alert when submission fails', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Server error')).toBeInTheDocument()
      );
      expect(
        screen.queryByText(/tour request submitted successfully/i)
      ).not.toBeInTheDocument();
    });

    it('does not clear form fields when submission fails', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm({ name: 'Jane Visitor', email: 'jane@example.com' });
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Server error')).toBeInTheDocument()
      );
      // Fields retain their values on failure
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jane Visitor');
      expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('jane@example.com');
    });

    it('re-enables the submit button after a failed submission', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /request tour/i })
        ).not.toBeDisabled()
      );
    });

    it('error alert can be manually closed with the × button', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Server error')).toBeInTheDocument()
      );
      const closeBtn = screen.getByRole('button', { name: /close error message/i });
      await userEvent.click(closeBtn);
      expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    });

    it('allows resubmission after a failed attempt', async () => {
      axios.post
        .mockRejectedValueOnce({
          response: { data: { message: 'Temporary server error' } },
        })
        .mockResolvedValueOnce({
          data: {
            message: 'Showing request submitted successfully',
            showing: { _id: 'showing-xyz', status: 'pending' },
          },
        });
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();

      // First submission – fails
      submitTourForm();
      await waitFor(() =>
        expect(screen.getByText('Temporary server error')).toBeInTheDocument()
      );

      // Second submission – succeeds
      submitTourForm();
      await waitFor(() =>
        expect(
          screen.getByText(/tour request submitted successfully/i)
        ).toBeInTheDocument()
      );
    });
  });

  // ── Submitting State ─────────────────────────────────────────────────────
  //
  // These tests use submitTourForm() (fireEvent.submit) for the same reason
  // as Error Scenarios: pending Promises cause act() to hang indefinitely
  // when using `await userEvent.click()`.

  describe('Submitting State', () => {
    it('shows "Submitting..." button text while the request is in-flight', async () => {
      let resolvePost;
      axios.post.mockReturnValue(
        new Promise((res) => {
          resolvePost = res;
        })
      );
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();

      await waitFor(() =>
        expect(screen.getByText('Submitting...')).toBeInTheDocument()
      );

      // Resolve to clean up
      await act(async () => {
        resolvePost({
          data: { message: 'Showing request submitted successfully', showing: {} },
        });
      });
    });

    it('disables the submit button while the request is in-flight', async () => {
      let resolvePost;
      axios.post.mockReturnValue(
        new Promise((res) => {
          resolvePost = res;
        })
      );
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /submitting/i })
        ).toBeDisabled()
      );

      await act(async () => {
        resolvePost({
          data: { message: 'Showing request submitted successfully', showing: {} },
        });
      });
    });

    it('restores "Request Tour" button text after submission completes', async () => {
      mockPostSuccess();
      renderPropertyDetails();
      await waitForPropertyLoad();
      fillTourForm();
      submitTourForm();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /request tour/i })
        ).toBeInTheDocument()
      );
    });
  });
});
