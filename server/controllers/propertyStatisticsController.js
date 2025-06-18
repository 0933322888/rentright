import PropertyStatistics from '../models/propertyStatisticsModel.js';
import Property from '../models/propertyModel.js';

// Get statistics for a property
export const getPropertyStatistics = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Check if property exists and user has access
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check if user is authorized (landlord or admin)
        if (req.user.role !== 'admin' && property.landlord.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these statistics' });
        }

        // Get date range (last 30 days by default)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Get statistics
        const statistics = await PropertyStatistics.getStatistics(propertyId, startDate, endDate);

        res.json(statistics);
    } catch (error) {
        console.error('Error in getPropertyStatistics:', error);
        res.status(500).json({ message: error.message });
    }
};

// Track a view for a property
export const trackPropertyView = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Increment view count for today
        await PropertyStatistics.incrementViews(propertyId, new Date());

        res.json({ message: 'View tracked successfully' });
    } catch (error) {
        console.error('Error in trackPropertyView:', error);
        res.status(500).json({ message: error.message });
    }
};

// Track a click for a property (when user clicks on property details)
export const trackPropertyClick = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Increment click count for today
        await PropertyStatistics.incrementClicks(propertyId, new Date());

        res.json({ message: 'Click tracked successfully' });
    } catch (error) {
        console.error('Error in trackPropertyClick:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get statistics for all properties of a landlord
export const getLandlordStatistics = async (req, res) => {
    try {
        // Get date range (last 30 days by default)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Get all properties for the landlord
        const properties = await Property.find({ landlord: req.user._id });
        const propertyIds = properties.map(p => p._id);

        // Get statistics for all properties
        const allStats = await PropertyStatistics.find({
            property: { $in: propertyIds },
            date: { $gte: startDate, $lte: endDate }
        }).populate('property', 'title');

        // Group by property
        const propertyStats = {};
        properties.forEach(property => {
            propertyStats[property._id] = {
                property: {
                    _id: property._id,
                    title: property.title
                },
                dailyStats: [],
                totalClicks: 0,
                totalViews: 0,
                averageClicksPerDay: 0,
                averageViewsPerDay: 0
            };
        });

        // Process statistics
        allStats.forEach(stat => {
            const propertyId = stat.property._id.toString();
            if (propertyStats[propertyId]) {
                propertyStats[propertyId].dailyStats.push({
                    date: stat.date.toISOString().split('T')[0],
                    clicks: stat.clicks,
                    views: stat.views
                });
                propertyStats[propertyId].totalClicks += stat.clicks;
                propertyStats[propertyId].totalViews += stat.views;
            }
        });

        // Calculate averages
        Object.values(propertyStats).forEach(stats => {
            if (stats.dailyStats.length > 0) {
                stats.averageClicksPerDay = Math.round(stats.totalClicks / stats.dailyStats.length);
                stats.averageViewsPerDay = Math.round(stats.totalViews / stats.dailyStats.length);
            }
        });

        res.json(Object.values(propertyStats));
    } catch (error) {
        console.error('Error in getLandlordStatistics:', error);
        res.status(500).json({ message: error.message });
    }
}; 