import React, { useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space, ConfigProvider, theme, Spin } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    SafetyOutlined,
    HistoryOutlined,
    CodeOutlined,
    GiftOutlined,
    SettingOutlined,
    LogoutOutlined,
    HomeOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Map path to active menu key
    const getActiveKey = () => {
        const path = location.pathname;
        if (path.includes('/admin/dashboard')) return 'dashboard';
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/applications')) return 'applications';
        if (path.includes('/admin/anticheat')) return 'anticheat';
        if (path.includes('/admin/logs')) return 'logs';
        if (path.includes('/admin/pages')) return 'pages';
        if (path.includes('/admin/badges')) return 'badges';
        if (path.includes('/admin/messenger')) return 'messenger';
        if (path.includes('/admin/settings')) return 'settings';
        return 'dashboard';
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Сводка',
            onClick: () => navigate('/admin/dashboard')
        },
        {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Игроки',
            onClick: () => navigate('/admin/users')
        },
        {
            key: 'applications',
            icon: <FileTextOutlined />,
            label: 'Заявки',
            onClick: () => navigate('/admin/applications')
        },
        {
            key: 'anticheat',
            icon: <SafetyOutlined />,
            label: 'Античит',
            onClick: () => navigate('/admin/anticheat')
        },
        {
            key: 'messenger',
            icon: <MessageOutlined />,
            label: 'Мессенджер',
            onClick: () => navigate('/admin/messenger')
        },
        {
            key: 'logs',
            icon: <HistoryOutlined />,
            label: 'Логи аудита',
            onClick: () => navigate('/admin/logs')
        },
        {
            key: 'pages',
            icon: <CodeOutlined />,
            label: 'Страницы',
            onClick: () => navigate('/admin/pages')
        },
        {
            key: 'badges',
            icon: <GiftOutlined />,
            label: 'Значки',
            onClick: () => navigate('/admin/badges')
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Настройки',
            onClick: () => navigate('/admin/settings')
        }
    ];

    const profileMenuItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: 'На главную',
            onClick: () => navigate('/')
        },
        {
            type: 'divider' as const
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Выход',
            danger: true,
            onClick: handleLogout
        }
    ];

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#00BFFF', // Sky blue (Legends Blue) from main site
                    colorBgBase: '#0b1320',   // Dark blue base background
                    colorBgContainer: '#14213d', // Dark blue card/dialog container background
                    colorBorder: 'rgba(0, 191, 255, 0.15)', // Global border color with blue tint
                    borderRadius: 12,
                },
                components: {
                    Layout: {
                        headerBg: '#0f1b2d', // Medium navy header
                        bodyBg: '#0b1320'
                    },
                    Menu: {
                        colorBgContainer: '#0f1b2d', // Medium navy sidebar menu
                        itemSelectedBg: 'rgba(0, 191, 255, 0.15)',    // Semi-transparent sky blue selected item
                        itemSelectedColor: '#00BFFF', // Sky blue text on selected item
                        itemHoverColor: '#00BFFF',
                        itemColor: 'rgba(255, 255, 255, 0.85)',
                    },
                    Select: {
                        colorBorder: 'rgba(0, 191, 255, 0.25)', // More visible border
                        colorPrimaryHover: '#00BFFF',
                        colorBgContainer: '#0b1320',
                    },
                    Input: {
                        colorBorder: 'rgba(0, 191, 255, 0.25)', // More visible border
                        colorPrimaryHover: '#00BFFF',
                        colorBgContainer: '#0b1320',
                    }
                }
            }}
        >
            <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="h-screen select-none bg-[#0b1320] admin-layout-wrapper">
                <Header style={{ background: '#0f1b2d', height: '64px' }} className="px-6 border-b border-white/5 flex items-center justify-between z-50 shrink-0">
                    <Space size={16} align="center">
                        <img
                            src="/images/logo.webp"
                            alt="StoryLegends Admin"
                            style={{ height: '36px', width: 'auto', cursor: 'pointer' }}
                            onClick={() => navigate('/admin/dashboard')}
                        />
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white"
                        />
                    </Space>
                    <Dropdown menu={{ items: profileMenuItems }} trigger={['click']}>
                        <Space className="cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all">
                            <Avatar
                                src={user?.avatarUrl}
                                size={36}
                                style={{
                                    backgroundColor: '#0086B3',
                                    verticalAlign: 'middle',
                                    border: '1px solid rgba(0, 191, 255, 0.3)'
                                }}
                            >
                                {user?.username?.substring(0, 1).toUpperCase()}
                            </Avatar>
                            <span className="text-white font-semibold hidden sm:inline text-sm">
                                {user?.username}
                            </span>
                        </Space>
                    </Dropdown>
                </Header>
                <Layout style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minHeight: 0 }}>
                    <Sider
                        trigger={null}
                        collapsible
                        collapsed={collapsed}
                        theme="dark"
                        className="border-r border-white/5"
                        width={240}
                        collapsedWidth={80}
                        style={{
                            height: '100%',
                            overflowY: 'auto',
                            background: '#0f1b2d' // Matches sidebar medium navy theme
                        }}
                    >
                        <Menu
                            theme="dark"
                            mode="inline"
                            selectedKeys={[getActiveKey()]}
                            items={menuItems}
                            className="py-4 font-medium"
                            style={{ background: '#0f1b2d' }}
                        />
                    </Sider>
                    <Content className="p-6 md:p-8 max-w-7xl w-full mx-auto" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                        <Suspense fallback={
                            <div className="flex items-center justify-center min-h-[400px]">
                                <Spin size="large" description="Загрузка страницы..." />
                            </div>
                        }>
                            <Outlet />
                        </Suspense>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default AdminLayout;

