import mongoose from 'mongoose';

const propertyStatisticsSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure unique property-date combinations
propertyStatisticsSchema.index({ property: 1, date: 1 }, { unique: true });

// Static method to get or create statistics for a property and date
propertyStatisticsSchema.statics.getOrCreate = async function (propertyId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let stats = await this.findOne({
        property: propertyId,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!stats) {
        stats = new this({
            property: propertyId,
            date: startOfDay,
            clicks: 0,
            views: 0
        });
        await stats.save();
    }

    return stats;
};

// Static method to increment clicks
propertyStatisticsSchema.statics.incrementClicks = async function (propertyId, date) {
    const stats = await this.getOrCreate(propertyId, date);
    stats.clicks += 1;
    return await stats.save();
};

// Static method to increment views
propertyStatisticsSchema.statics.incrementViews = async function (propertyId, date) {
    const stats = await this.getOrCreate(propertyId, date);
    stats.views += 1;
    return await stats.save();
};

// Static method to get statistics for a property within a date range
propertyStatisticsSchema.statics.getStatistics = async function (propertyId, startDate, endDate) {
    const stats = await this.find({
        property: propertyId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
    const totalViews = stats.reduce((sum, stat) => sum + stat.views, 0);
    const averageClicksPerDay = stats.length > 0 ? Math.round(totalClicks / stats.length) : 0;
    const averageViewsPerDay = stats.length > 0 ? Math.round(totalViews / stats.length) : 0;

    return {
        dailyStats: stats.map(stat => ({
            date: stat.date.toISOString().split('T')[0],
            clicks: stat.clicks,
            views: stat.views
        })),
        totalClicks,
        totalViews,
        averageClicksPerDay,
        averageViewsPerDay
    };
};

const PropertyStatistics = mongoose.model('PropertyStatistics', propertyStatisticsSchema);

export default PropertyStatistics; 