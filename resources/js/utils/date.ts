import dayjs from 'dayjs';

export const DATE_FORMAT = 'DD/MM/YYYY';
export const API_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Format a date to DD/MM/YYYY for display
 */
export const formatDate = (date?: string | Date | dayjs.Dayjs | null, format = DATE_FORMAT) => {
    if (!date) return '';
    return dayjs(date).format(format);
};

/**
 * Format a date to YYYY-MM-DD for API requests
 */
export const formatApiDate = (date?: string | Date | dayjs.Dayjs | null) => {
    if (!date) return '';
    return dayjs(date).format(API_DATE_FORMAT);
};

/**
 * Parse a string into a dayjs object
 */
export const parseDate = (dateStr: string, format = DATE_FORMAT) => {
    if (!dateStr) return null;
    return dayjs(dateStr, format);
};
