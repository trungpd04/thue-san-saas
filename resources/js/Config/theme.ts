import { ThemeConfig } from 'antd';

const GREEN_MA = '#7CB305';

const theme: ThemeConfig = {
    token: {
        colorPrimary: GREEN_MA,
        colorLink: GREEN_MA,
        colorSuccess: '#52c41a',
        borderRadius: 8,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    components: {
        Menu: {
            darkItemSelectedBg: GREEN_MA,
            darkItemSelectedColor: '#fff',
        },
        Button: {
            primaryColor: '#fff',
        },
        Layout: {
            headerBg: '#fff',
            siderBg: '#001529',
        },
    },
};

export default theme;
