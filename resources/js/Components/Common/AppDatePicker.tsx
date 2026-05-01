import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/utils/date';

interface AppDatePickerProps {
    value?: string | dayjs.Dayjs | null;
    onChange?: (date: dayjs.Dayjs | null, dateString: string | string[] | any) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    allowClear?: boolean;
    format?: string;
    picker?: 'date' | 'month' | 'year' | 'quarter' | 'week';
    className?: string;
    [key: string]: any;
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'Chọn ngày',
    style = { width: '100%' },
    allowClear = false,
    format,
    picker = 'date',
    className,
    ...props
}) => {
    // Determine default format based on picker
    const defaultFormat = format || (picker === 'month' ? 'MM/YYYY' : picker === 'year' ? 'YYYY' : DATE_FORMAT);

    // Convert string value to dayjs object if needed
    const dateValue = value ? (typeof value === 'string' ? dayjs(value) : value) : null;

    return (
        <DatePicker
            value={dateValue}
            onChange={onChange}
            format={defaultFormat}
            picker={picker}
            placeholder={placeholder}
            style={style}
            allowClear={allowClear}
            className={className}
            {...props}
        />
    );
};

export default AppDatePicker;
