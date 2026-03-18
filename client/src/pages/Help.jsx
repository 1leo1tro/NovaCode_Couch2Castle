import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Help.css';

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
            <h2>{section.category}</h2>
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
    </div>
  );
}
