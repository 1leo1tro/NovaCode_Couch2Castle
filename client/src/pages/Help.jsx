import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Help.css';

const categoryIcons = {
  'Buying a Home': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  'For Agents': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
      <circle cx="12" cy="14" r="2"/>
      <path d="M12 16v2"/>
    </svg>
  ),
  'General': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
};

const faqs = [
  {
    category: 'Buying a Home',
    items: [
      {
        question: 'How do I search for properties?',
        answer:
          'Head to our Listings page to browse all available properties. You can search by keyword, filter by price range, or narrow results by ZIP code. Click on any property card to view full details.',
      },
      {
        question: 'How do I schedule a tour?',
        answer:
          'Open any property listing and scroll to the "Schedule a Tour" form on the right side. Fill in your name, email, phone number, and preferred date. The listing agent will be notified and can confirm your tour.',
      },
      {
        question: 'What does property status mean?',
        answer:
          'Active means the property is currently available. Pending means an offer has been accepted but the sale is not yet finalized. Sold means the transaction is complete.',
      },
      {
        question: 'Is there a cost to browse or request a tour?',
        answer:
          'No. Browsing listings and requesting tours on Couch2Castle is completely free for buyers.',
      },
    ],
  },
  {
    category: 'For Agents',
    items: [
      {
        question: 'How do I list a property?',
        answer:
          'Sign in to your agent account, then click "Create Listing" on the Listings page. Fill in the property details including address, price, square footage, and images. Your listing will go live immediately.',
      },
      {
        question: 'How do I manage showing requests?',
        answer:
          'After signing in, click the notification bell in the navbar to go to your Showings dashboard. From there you can confirm, complete, or cancel tour requests for your listings.',
      },
      {
        question: 'Can I edit or remove my listings?',
        answer:
          'Yes. On the Listings page, your own listings will show Edit and Delete buttons. You can update any details or remove a listing entirely.',
      },
      {
        question: 'How do I create an agent account?',
        answer:
          'Agent registration requires a valid real estate license number. Contact our team through the "Find an Agent" page to get set up.',
      },
    ],
  },
  {
    category: 'General',
    items: [
      {
        question: 'How do I contact support?',
        answer:
          'Visit our Contact page to send us a message. You can also reach our support team at support@couch2castle.com.',
      },
      {
        question: 'Is my personal information secure?',
        answer:
          'Yes. We use industry-standard encryption and never share your personal information with third parties without your consent.',
      },
    ],
  },
];

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`help-accordion-item ${open ? 'open' : ''}`}>
      <button className="help-accordion-toggle" onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <motion.span
          className="help-accordion-icon"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="help-accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="help-accordion-body-inner">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  return (
    <div className="help-page">
      <div className="help-hero">
        <h1>How can we help?</h1>
        <p>
          Find answers to common questions about buying, selling, and using
          Couch2Castle.
        </p>
      </div>

      <div className="help-content">
        {faqs.map((section) => (
          <div key={section.category} className="help-section">
            <h2>
              <span className="help-section-icon">{categoryIcons[section.category]}</span>
              {section.category}
            </h2>
            <div className="help-accordion">
              {section.items.map((item) => (
                <AccordionItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="help-cta">
          <p>Still have questions?</p>
          <Link to="/contacts" className="help-cta-btn">
            Contact Us
          </Link>
        </div>
      </div>

      <footer className="help-footer">
        <div className="help-footer-channels">
          <div className="help-footer-channel">
            <span className="help-footer-channel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.8 19.79 19.79 0 0 1 1.09 3.18 2 2 0 0 1 3.07 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <div>
              <p className="help-footer-channel-label">Call Us</p>
              <p className="help-footer-channel-value">1-800-C2-CASTLE</p>
              <p className="help-footer-channel-note">Mon–Fri, 9 am–6 pm EST</p>
            </div>
          </div>
          <div className="help-footer-channel">
            <span className="help-footer-channel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <div>
              <p className="help-footer-channel-label">Email Support</p>
              <p className="help-footer-channel-value">support@couch2castle.com</p>
              <p className="help-footer-channel-note">We reply within 24 hours</p>
            </div>
          </div>
          <div className="help-footer-channel">
            <span className="help-footer-channel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <div>
              <p className="help-footer-channel-label">Live Chat</p>
              <p className="help-footer-channel-value">Chat with an agent</p>
              <p className="help-footer-channel-note">Available on the Contact page</p>
            </div>
          </div>
        </div>
        <div className="help-footer-bottom">
          <div className="help-footer-links">
            <Link to="/listings">Browse Listings</Link>
            <Link to="/contacts">Find an Agent</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          <p className="help-footer-copy">© {new Date().getFullYear()} Couch2Castle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
