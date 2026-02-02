// TODO: In the future, fetch listing data from the backend API instead of the static array.
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { allProperties } from './properties';
import './PropertyDetails.css';

const propertyImages = {
  1: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80',
  ],
  2: [
    'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
  ],
  3: [
    'https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
  ],
  4: [
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=600&q=80',
  ],
  5: [
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
  ],
  6: [
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=600&q=80',
  ],
  7: [
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=600&q=80',
  ],
  8: [
    'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=600&q=80',
  ],
  9: [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  ],
  10: [
    'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
  ],
};

const PropertyDetails = () => {
  const { id } = useParams();
  const property = allProperties.find((p) => p.id === Number(id));
  if (!property) return <div className="property-details"><h2>Property not found</h2></div>;
  const images = propertyImages[property.id] || [property.image];

  // Carousel state
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const prevImage = () => setCurrent((c) => (c === 0 ? total - 1 : c - 1));
  const nextImage = () => setCurrent((c) => (c === total - 1 ? 0 : c + 1));

  return (
    <div className="property-details">
      <h1>{property.title}</h1>
      <div className="property-gallery-carousel">
        <button className="carousel-btn" onClick={prevImage} aria-label="Previous image">&#8592;</button>
        <img
          src={images[current]}
          alt={property.title + ' photo ' + (current + 1)}
          className="carousel-image"
        />
        <button className="carousel-btn" onClick={nextImage} aria-label="Next image">&#8594;</button>
      </div>
      <div className="carousel-indicator">{current + 1} / {total}</div>
      <div className="property-meta">
        <p><strong>Location:</strong> {property.location}</p>
        <p><strong>Price:</strong> ${property.price.toLocaleString()}</p>
        <p><strong>Square Footage:</strong> {property.sqft} sqft</p>
        <p><strong>Beds:</strong> {property.beds}</p>
        <p><strong>Baths:</strong> {property.baths}</p>
      </div>
      <section className="schedule-tour">
        <h2>Schedule a Tour</h2>
        <form className="tour-form">
          <label>Name<input type="text" name="name" required /></label>
          <label>Email<input type="email" name="email" required /></label>
          <label>Preferred Date<input type="date" name="date" required /></label>
          <label>Message<textarea name="message" rows="3" /></label>
          <button type="submit">Request Tour</button>
        </form>
      </section>
    </div>
  );
};

export default PropertyDetails;
