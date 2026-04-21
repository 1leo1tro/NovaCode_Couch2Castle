import Listing from '../models/Listing.js';
import Showing from '../models/Showing.js';
import { isDatabaseConnectionError, handleDatabaseError } from '../utils/errorHandler.js';

const MS_PER_DAY = 86400000;

// Returns a map of listingId -> { total, completed } showing counts
const buildShowingCountMap = async (listingIds) => {
  const rows = await Showing.aggregate([
    { $match: { listing: { $in: listingIds } } },
    {
      $group: {
        _id: '$listing',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  return Object.fromEntries(rows.map(r => [r._id.toString(), { total: r.total, completed: r.completed }]));
};

const attachCounts = (listings, showingCountMap) =>
  listings.map(l => {
    const counts = showingCountMap[l._id.toString()] || { total: 0, completed: 0 };
    return { ...l, showingCount: counts.total, completedShowings: counts.completed };
  });

/**
 * @desc    Get open listings report — all agents
 * @route   GET /api/reports/open
 * @access  Manager only
 */
export const getOpenListingsReport = async (req, res) => {
  try {
    const query = { status: { $in: ['active', 'pending'] } };

    const listings = await Listing.find(query, {
      address: 1, zipCode: 1, price: 1, status: 1,
      createdAt: 1, createdBy: 1, viewCount: 1
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const showingCountMap = await buildShowingCountMap(listings.map(l => l._id));
    const enriched = attachCounts(listings, showingCountMap);

    const summary = {
      totalListings: enriched.length,
      totalValue: enriched.reduce((sum, l) => sum + (l.price ?? 0), 0),
      totalViews: enriched.reduce((sum, l) => sum + (l.viewCount ?? 0), 0),
      totalShowings: enriched.reduce((sum, l) => sum + l.showingCount, 0),
    };

    return res.status(200).json({ success: true, listings: enriched, summary });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to generate open listings report',
      error: error.message,
    });
  }
};

/**
 * @desc    Get closed listings report — all agents
 * @route   GET /api/reports/closed
 * @access  Manager only
 */
export const getClosedListingsReport = async (req, res) => {
  try {
    const query = { status: 'sold' };

    const listings = await Listing.find(query, {
      address: 1, zipCode: 1, price: 1, finalSalePrice: 1,
      closingDate: 1, daysOnMarket: 1, createdAt: 1, createdBy: 1, viewCount: 1
    })
      .populate('createdBy', 'name')
      .sort({ closingDate: -1 })
      .lean();

    const showingCountMap = await buildShowingCountMap(listings.map(l => l._id));
    const enriched = attachCounts(listings, showingCountMap);

    const totalListings = enriched.length;
    const totalValue = enriched.reduce((sum, l) => sum + (l.finalSalePrice ?? l.price ?? 0), 0);
    const avgSalePrice = totalListings > 0 ? totalValue / totalListings : 0;

    const domValues = enriched
      .map(l => l.daysOnMarket ?? (l.closingDate
        ? Math.round((new Date(l.closingDate) - new Date(l.createdAt)) / MS_PER_DAY)
        : null))
      .filter(v => v !== null);
    const avgDaysOnMarket = domValues.length > 0
      ? domValues.reduce((s, v) => s + v, 0) / domValues.length
      : 0;

    const summary = {
      totalListings,
      totalValue,
      avgSalePrice,
      avgDaysOnMarket,
      totalViews: enriched.reduce((sum, l) => sum + (l.viewCount ?? 0), 0),
      totalShowings: enriched.reduce((sum, l) => sum + l.showingCount, 0),
      totalCompletedShowings: enriched.reduce((sum, l) => sum + l.completedShowings, 0),
    };

    return res.status(200).json({ success: true, listings: enriched, summary });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to generate closed listings report',
      error: error.message,
    });
  }
};
