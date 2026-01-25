// Mock Data
const mockListings = [
  {
    id: 1,
    price: 250000,
    address: "123 Main St, Huntsville, AL 35801",
    squareFeet: 1500,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  },
  {
    id: 2,
    price: 350000,
    address: "456 Oak Ave, Huntsville, AL 35802",
    squareFeet: 2200,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  },
  {
    id: 3,
    price: 180000,
    address: "789 Pine Rd, Madison, AL 35758",
    squareFeet: 1200,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  }
];

// Get all listings
export const getAllListings = (req, res) => {
  res.json({ listings: mockListings });
};

// Get single listing by id
export const getListingById = (req, res) => {
  const { id } = req.params;
  const listing = mockListings.find(l => l.id === parseInt(id));
  
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  
  res.json({ listing });
};