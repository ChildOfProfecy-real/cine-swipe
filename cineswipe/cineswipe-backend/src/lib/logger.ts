import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV !== 'production'
            ? { target: 'pino/file', options: { destination: './backend.log' } }
            : undefined,
    // In production, output raw JSON for log aggregation
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
