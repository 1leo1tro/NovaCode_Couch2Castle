import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/PropertyDetails.css';

const interiorImages = [
  { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', label: 'Living room' },
  { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80', label: 'Kitchen' },
  { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', label: 'Bedroom' },
  { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80', label: 'Bathroom' },
  { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80', label: 'Dining area' },
  { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', label: 'Interior view' },
];

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/listings/${id}`);
        setProperty(response.data.data);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await axios.delete(`/api/listings/${id}`);
      navigate('/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  if (loading) return <div className="property-details-page"><h2>Loading...</h2></div>;
  if (error) return <div className="property-details-page"><h2>Error: {error}</h2></div>;
  if (!property) return <div className="property-details-page"><h2>Property not found</h2></div>;

  const gallery = property.images && property.images.length > 0
    ? [...property.images, ...interiorImages.map((i) => i.url)].slice(0, 6)
    : interiorImages.map((i) => i.url).slice(0, 6);

  return (
    <div className="property-details-page">
      {isAuthenticated() && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginBottom: '16px'
        }}>
          <Link
            to={`/listings/edit/${property._id}`}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Edit Listing
          </Link>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Delete Listing
          </button>
        </div>
      )}

      <div className="property-details-hero">
        <div className="property-details-main-image">
          <img src={gallery[0]} alt={property.address} />
          {property.status && property.status !== 'active' && (
            <span className="property-details-badge">{property.status.toUpperCase()}</span>
          )}
        </div>
        <div className="property-details-gallery-grid">
          {gallery.slice(1, 6).map((img, idx) => (
            <div key={idx} className="property-details-gallery-thumb">
              <img src={img} alt={`${property.address} - ${interiorImages[idx]?.label || 'Photo'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="property-details-content">
        <div className="property-details-main">
          <h1>{property.address}</h1>
          <p className="property-details-address">ZIP Code: {property.zipCode}</p>

          <div className="property-details-highlights">
            <span>${property.price.toLocaleString()}</span>
            <span>{property.squareFeet.toLocaleString()} sqft</span>
            <span>Status: {property.status}</span>
          </div>

          <section className="property-details-description">
            <h2>About this home</h2>
            <p>
              Welcome to this property located at {property.address}. This beautifully maintained property
              offers {property.squareFeet.toLocaleString()} square feet of living space.
              The property is currently {property.status} and is priced at ${property.price.toLocaleString()}.
            </p>
            <p>
              Located in the {property.zipCode} area, this property offers convenient access to local amenities
              and is perfect for those looking for quality living space. Don&apos;t miss your chance to make
              this exceptional property your new home.
            </p>
          </section>

          <section className="property-details-features">
            <h2>Property Information</h2>
            <ul>
              <li>Square Feet: {property.squareFeet.toLocaleString()}</li>
              <li>ZIP Code: {property.zipCode}</li>
              <li>Status: {property.status}</li>
              <li>Price: ${property.price.toLocaleString()}</li>
              {property.createdBy && (
                <li>Listed by: {property.createdBy.name || property.createdBy.email}</li>
              )}
            </ul>
          </section>
        </div>

        <aside className="property-details-sidebar">
          <div className="property-details-card">
            <h3>Schedule a Tour</h3>
            <form className="tour-form" onSubmit={(e) => e.preventDefault()}>
              <label>Name<input type="text" name="name" placeholder="Your name" required /></label>
              <label>Email<input type="email" name="email" placeholder="you@example.com" required /></label>
              <label>Preferred Date<input type="date" name="date" required /></label>
              <label>Message<textarea name="message" rows="3" placeholder="Any questions or special requests?" /></label>
              <button type="submit">Request Tour</button>
            </form>
          </div>

          <div className="property-details-card property-details-agent">
            <div className="property-details-agent-avatar">
              {property.createdBy?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="property-details-agent-name">
                {property.createdBy?.name || 'Listed by Agent'}
              </p>
              <p className="property-details-agent-phone">
                {property.createdBy?.phone || '(555) 123-4567'}
              </p>
              <button type="button" className="property-details-agent-btn">Contact Agent</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PropertyDetails;
