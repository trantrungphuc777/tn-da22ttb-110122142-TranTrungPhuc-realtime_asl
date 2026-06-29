import mongoose from 'mongoose';

export const checkDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Database đang bảo trì hoặc không khả dụng',
            databaseStatus: 'disconnected',
            code: 'DB_UNAVAILABLE'
        });
    }
    next();
};
