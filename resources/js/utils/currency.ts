/** Parse Laravel decimal/string/number amounts to integer VND for display / APIs. */
export const normalizeVNDAmount = (value?: string | number | null): number => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.round(value) : 0;
    }
    const trimmed = `${value}`.trim();
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isNaN(parsed)) {
        return Math.round(parsed);
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
};

export const formatNumberWithDots = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    const n = normalizeVNDAmount(value);

    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatVND = (value?: string | number | null) => {
    const formattedValue = formatNumberWithDots(value);

    return formattedValue ? `${formattedValue} VNĐ` : '0 VNĐ';
};

export const parseVND = (value?: string) => Number(value?.replace(/[^\d]/g, '') || 0);
