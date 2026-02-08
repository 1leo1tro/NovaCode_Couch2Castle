import { useParams } from 'react-router-dom';
import { allProperties } from './Home';
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
  const property = allProperties.find((p) => p.id === Number(id));
  if (!property) return <div className="property-details-page"><h2>Property not found</h2></div>;

  const mainImage = property.image;
  const gallery = [mainImage, ...interiorImages.map((i) => i.url).filter((url) => url !== mainImage)].slice(0, 6);

  return (
    <div className="property-details-page">
      <div className="property-details-hero">
        <div className="property-details-main-image">
          <img src={gallery[0]} alt={property.title} />
          {property.badge && <span className="property-details-badge">{property.badge}</span>}
        </div>
        <div className="property-details-gallery-grid">
          {gallery.slice(1, 6).map((img, idx) => (
            <div key={idx} className="property-details-gallery-thumb">
              <img src={img} alt={`${property.title} - ${interiorImages[idx]?.label || 'Photo'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="property-details-content">
        <div className="property-details-main">
          <h1>{property.title}</h1>
          <p className="property-details-address">{property.address} • {property.location}</p>

          <div className="property-details-highlights">
            <span>${property.price.toLocaleString()}</span>
            <span>{property.beds} bed{property.beds !== 1 ? 's' : ''}</span>
            <span>{property.baths} bath{property.baths !== 1 ? 's' : ''}</span>
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>

          <section className="property-details-description">
            <h2>About this home</h2>
            <p>
              Welcome to this stunning {property.propertyType} in the heart of {property.location}. This beautifully maintained property
              features {property.beds} spacious bedrooms and {property.baths} modern bathrooms, perfect for families or professionals.
              The open-concept living areas flow seamlessly, with plenty of natural light and high-end finishes throughout.
            </p>
            <p>
              The kitchen boasts contemporary appliances and ample counter space for entertaining. Relax in the private backyard
              or enjoy the nearby amenities. Don&apos;t miss your chance to make this exceptional property your new home.
            </p>
          </section>

          <section className="property-details-features">
            <h2>Key features</h2>
            <ul>
              <li>Spacious floor plan</li>
              <li>Modern appliances</li>
              <li>Natural light</li>
              <li>Private outdoor space</li>
              <li>Central location</li>
              <li>Quality finishes</li>
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
            <div className="property-details-agent-avatar">A</div>
            <div>
              <p className="property-details-agent-name">Listed by Agent</p>
              <p className="property-details-agent-phone">(555) 123-4567</p>
              <button type="button" className="property-details-agent-btn">Contact Agent</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PropertyDetails;
