// Database connection state manager
import mongoose from 'mongoose';

export const dbState = {
    isConnected: false,
    connection: null
};

export const setDbConnected = (state) => {
    dbState.isConnected = state;
};

export const isDbConnected = () => dbState.isConnected;

export const getConnection = () => dbState.connection;

// Override mongoose connect to track connection state
const originalConnect = mongoose.connect;
mongoose.connect = async (...args) => {
    try {
        dbState.connection = await originalConnect.apply(mongoose, args);
        setDbConnected(true);
        return dbState.connection;
    } catch (error) {
        setDbConnected(false);
        throw error;
    }
};

mongoose.connection.on('disconnected', () => {
    setDbConnected(false);
});

mongoose.connection.on('reconnected', () => {
    setDbConnected(true);
});
