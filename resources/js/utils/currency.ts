export const formatNumberWithDots = (value?: string | number | null) => {
    const numericValue = `${value ?? ''}`.replace(/[^\d]/g, '');

    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatVND = (value?: string | number | null) => {
    const formattedValue = formatNumberWithDots(value);

    return formattedValue ? `${formattedValue} VNĐ` : '0 VNĐ';
};

export const parseVND = (value?: string) => Number(value?.replace(/[^\d]/g, '') || 0);
