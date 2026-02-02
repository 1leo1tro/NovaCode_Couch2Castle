// TODO: In the future, fetch listing data from the backend API instead of the static array.
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { allProperties } from './properties';
import './PropertyDetails.css';

const propertyImages = [
  'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1634344656611-0773d8dbbe2c?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
];

const PropertyDetails = () => {
  const { id } = useParams();
  const property = allProperties.find((p) => p.id === Number(id));
  if (!property) return <div className="property-details"><h2>Property not found</h2></div>;
  const images = propertyImages;

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
