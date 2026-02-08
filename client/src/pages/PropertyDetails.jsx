// TODO: In the future, fetch listing data from the backend API instead of the static array.
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { allProperties } from './properties';
import './PropertyDetails.css';

const propertyImages = {
  1: [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyfHx8ZW58MHx8fHx8',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxfHx8ZW58MHx8fHx8',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxMXx8fGVufDB8fHx8fA%3D%3D',
  ],
  2: [
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxM3x8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNnx8fGVufDB8fHx8fA%3D%3D',
  ],
  3: [
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxOXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMnx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMXx8fGVufDB8fHx8fA%3D%3D',
  ],
  4: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyfHx8ZW58MHx8fHx8',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxfHx8ZW58MHx8fHx8',
  ],
  5: [
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxMXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxM3x8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNXx8fGVufDB8fHx8fA%3D%3D',
  ],
  6: [
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNnx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxOXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMnx8fGVufDB8fHx8fA%3D%3D',
  ],
  7: [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyfHx8ZW58MHx8fHx8',
  ],
  8: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxfHx8ZW58MHx8fHx8',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxMXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxM3x8fGVufDB8fHx8fA%3D%3D',
  ],
  9: [
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxNnx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxOXx8fGVufDB8fHx8fA%3D%3D',
  ],
  10: [
    'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMnx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMXx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwyMHx8fGVufDB8fHx8fA%3D%3D',
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
