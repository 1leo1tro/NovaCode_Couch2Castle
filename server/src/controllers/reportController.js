import Listing from '../models/Listing.js';
import { isDatabaseConnectionError, handleDatabaseError } from '../utils/errorHandler.js';

const MS_PER_DAY = 86400000;

/**
 * @desc    Get open listings report grouped by agent
 * @route   GET /api/reports/open
 * @access  Protected
 */
export const getOpenListingsReport = async (req, res) => {
  try {
    const results = await Listing.aggregate([
      {
        $match: {
          status: { $in: ['active', 'pending'] },
        },
      },
      {
        $group: {
          _id: '$createdBy',
          listingCount: { $sum: 1 },
          totalValue: { $sum: '$price' },
        },
      },
      {
        $lookup: {
          from: 'Agents',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      {
        $unwind: {
          path: '$agent',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          agent: {
            _id: '$agent._id',
            name: '$agent.name',
            email: '$agent.email',
          },
          listingCount: 1,
          totalValue: 1,
        },
      },
      {
        $sort: { totalValue: -1 },
      },
    ]);

    const summary = results.reduce(
      (acc, item) => {
        acc.totalAgents += 1;
        acc.totalListings += item.listingCount;
        acc.totalValue += item.totalValue;
        return acc;
      },
      { totalAgents: 0, totalListings: 0, totalValue: 0 }
    );

    return res.status(200).json({
      success: true,
      data: results,
      summary,
    });
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
 * @desc    Get closed listings report grouped by agent
 * @route   GET /api/reports/closed
 * @access  Protected
 */
export const getClosedListingsReport = async (req, res) => {
  try {
    const results = await Listing.aggregate([
      {
        $match: {
          status: 'sold',
        },
      },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$finalSalePrice', '$price'] } },
          avgSalePrice: { $avg: { $ifNull: ['$finalSalePrice', '$price'] } },
          avgDaysOnMarket: {
            $avg: {
              $ifNull: [
                '$daysOnMarket',
                {
                  $divide: [
                    { $subtract: [{ $ifNull: ['$closingDate', '$updatedAt'] }, '$createdAt'] },
                    MS_PER_DAY,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'Agents',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      {
        $unwind: {
          path: '$agent',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          agent: {
            _id: '$agent._id',
            name: '$agent.name',
            email: '$agent.email',
          },
          count: 1,
          totalValue: 1,
          avgSalePrice: 1,
          avgDaysOnMarket: 1,
        },
      },
      {
        $sort: { totalValue: -1 },
      },
    ]);

    const summary = results.reduce(
      (acc, item) => {
        acc.totalAgents += 1;
        acc.totalListings += item.count;
        acc.totalValue += item.totalValue;
        acc._weightedSalePrice += item.avgSalePrice * item.count;
        acc._weightedDaysOnMarket += item.avgDaysOnMarket * item.count;
        return acc;
      },
      { totalAgents: 0, totalListings: 0, totalValue: 0, _weightedSalePrice: 0, _weightedDaysOnMarket: 0 }
    );

    const { _weightedSalePrice, _weightedDaysOnMarket, ...summaryBase } = summary;
    summaryBase.avgSalePrice = summaryBase.totalListings > 0 ? _weightedSalePrice / summaryBase.totalListings : 0;
    summaryBase.avgDaysOnMarket = summaryBase.totalListings > 0 ? _weightedDaysOnMarket / summaryBase.totalListings : 0;

    return res.status(200).json({
      success: true,
      data: results,
      summary: summaryBase,
    });
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
