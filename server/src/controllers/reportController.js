import Listing from '../models/Listing.js';
import Showing from '../models/Showing.js';
import Agent from '../models/Agent.js';
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

/**
 * @desc    Overview KPIs for manager dashboard
 * @route   GET /api/reports/overview
 * @access  Manager only
 */
export const getOverviewReport = async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [activeAgents, activeListings, pendingShowings, soldSummary, closingsThisMonth] = await Promise.all([
      Agent.countDocuments({ role: { $nin: ['manager', 'admin'] }, isActive: true }),
      Listing.countDocuments({ status: { $in: ['active', 'pending'] } }),
      Showing.countDocuments({ status: 'pending' }),
      Listing.aggregate([
        { $match: { status: 'sold' } },
        { $group: { _id: null, volume: { $sum: { $ifNull: ['$finalSalePrice', '$price'] } }, count: { $sum: 1 } } }
      ]),
      Listing.countDocuments({ status: 'sold', closingDate: { $gte: startOfMonth } })
    ]);

    const sold = soldSummary[0] || { volume: 0, count: 0 };

    return res.status(200).json({
      success: true,
      overview: {
        activeAgents,
        activeListings,
        pendingShowings,
        totalSalesVolume: sold.volume,
        totalSold: sold.count,
        closingsThisMonth
      }
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) return res.status(503).json(handleDatabaseError());
    return res.status(500).json({ success: false, message: 'Failed to load overview', error: error.message });
  }
};

/**
 * @desc    All agents with performance stats
 * @route   GET /api/reports/agents
 * @access  Manager only
 */
export const getAgentsReport = async (req, res) => {
  try {
    const agents = await Agent.find({ role: { $nin: ['manager', 'admin'] } }, 'name email phone isActive createdAt').lean();
    const agentIds = agents.map(a => a._id);

    const [listingStats, showingStats] = await Promise.all([
      Listing.aggregate([
        { $match: { createdBy: { $in: agentIds } } },
        { $group: {
          _id: '$createdBy',
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: [{ $in: ['$status', ['active', 'pending']] }, 1, 0] } },
          soldListings: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
          salesVolume: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, { $ifNull: ['$finalSalePrice', 0] }, 0] } }
        }}
      ]),
      Showing.aggregate([
        { $match: { status: 'pending' } },
        { $lookup: { from: 'listings', localField: 'listing', foreignField: '_id', as: 'l' } },
        { $unwind: { path: '$l', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$l.createdBy', pendingShowings: { $sum: 1 } } }
      ])
    ]);

    const lsMap = Object.fromEntries(listingStats.map(s => [s._id.toString(), s]));
    const ssMap = Object.fromEntries(showingStats.map(s => [s._id?.toString(), s]));

    const enriched = agents.map(a => {
      const ls = lsMap[a._id.toString()] || { totalListings: 0, activeListings: 0, soldListings: 0, salesVolume: 0 };
      const ss = ssMap[a._id.toString()] || { pendingShowings: 0 };
      return { ...a, totalListings: ls.totalListings, activeListings: ls.activeListings, soldListings: ls.soldListings, salesVolume: ls.salesVolume, pendingShowings: ss.pendingShowings };
    }).sort((a, b) => b.totalListings - a.totalListings);

    return res.status(200).json({ success: true, agents: enriched });
  } catch (error) {
    if (isDatabaseConnectionError(error)) return res.status(503).json(handleDatabaseError());
    return res.status(500).json({ success: false, message: 'Failed to load agents report', error: error.message });
  }
};

/**
 * @desc    All showings across all agents
 * @route   GET /api/reports/showings
 * @access  Manager only
 */
export const getAllShowingsReport = async (req, res) => {
  try {
    const [showings, counts] = await Promise.all([
      Showing.find()
        .populate({ path: 'listing', select: 'address zipCode createdBy', populate: { path: 'createdBy', select: 'name' } })
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      Showing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const summary = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    counts.forEach(c => { summary[c._id] = c.count; summary.total += c.count; });

    return res.status(200).json({ success: true, showings, summary });
  } catch (error) {
    if (isDatabaseConnectionError(error)) return res.status(503).json(handleDatabaseError());
    return res.status(500).json({ success: false, message: 'Failed to load showings report', error: error.message });
  }
};
