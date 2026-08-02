import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Tag, Modal, Form, Avatar, message, Tooltip, Checkbox } from 'antd';
import {
    SearchOutlined,
    UserAddOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { adminApi } from '../../../api/admin';
import type { User } from '../../../api/users';
import { useAdminWebSocket } from '../../../hooks/useAdminWebSocket';
import PlayerDossier from '../shared/PlayerDossier';

const { Option } = Select;

const UsersTab: React.FC = () => {
    // Data and pagination states
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Dossier state
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [dossierVisible, setDossierVisible] = useState(false);

    // Create modal
    const [isCreateVisible, setIsCreateVisible] = useState(false);
    const [form] = Form.useForm();
    const location = useLocation();

    // Parse location query/state for active filters on load
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filter = params.get('filter') || location.state?.filter;
        if (filter === 'sponsors' || filter === 'SPONSOR') {
            setStatusFilter('SPONSOR');
        } else if (filter === 'banned' || filter === 'BANNED') {
            setStatusFilter('BANNED');
        } else if (filter === 'warned' || filter === 'WARNED') {
            setStatusFilter('WARNED');
        }
    }, [location]);

    const fetchUsers = async (currentPage = page, query = searchQuery, status = statusFilter) => {
        setLoading(true);
        try {
            const data = await adminApi.getAllUsers(currentPage, pageSize, query || undefined, undefined, status || undefined);
            setUsers(data.content);
            setTotalElements(data.totalElements);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            message.error('Не удалось загрузить список игроков');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(0, searchQuery, statusFilter);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    useAdminWebSocket({
        '/topic/admin/users': () => {
            fetchUsers(page, searchQuery, statusFilter);
        }
    });

    const handleSearch = () => {
        fetchUsers(0, searchQuery, statusFilter);
        setPage(0);
    };

    const handleTableChange = (pagination: any) => {
        const newPage = pagination.current - 1;
        const newSize = pagination.pageSize;
        setPage(newPage);
        setPageSize(newSize);
        // Refetch with explicit new size
        setLoading(true);
        adminApi.getAllUsers(newPage, newSize, searchQuery || undefined, undefined, statusFilter || undefined)
            .then(data => { setUsers(data.content); setTotalElements(data.totalElements); })
            .catch(() => message.error('Не удалось загрузить список игроков'))
            .finally(() => setLoading(false));
    };

    const openDossier = (userId: number) => {
        setSelectedUserId(userId);
        setDossierVisible(true);
    };

    // Create user
    const handleCreateUser = async (values: any) => {
        try {
            await adminApi.createUser(values);
            message.success('Пользователь успешно создан');
            setIsCreateVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (err: any) {
            console.error('Failed to create user:', err);
            message.error(err.response?.data?.message || 'Не удалось создать пользователя');
        }
    };

    // Table columns definition
    const columns = [
        {
            title: 'Игрок',
            key: 'user',
            render: (_: any, record: User) => {
                const isSuspicious = record.hasCoincidences || record.hasBannedCoincidences || record.hasSuspiciousMods;
                
                const getWarningTooltip = () => {
                    const warnings: string[] = [];
                    if (record.hasBannedCoincidences) {
                        warnings.push("Совпадения по IP/Отпечатку с забаненными аккаунтами!");
                    } else if (record.hasCoincidences) {
                        warnings.push("Совпадения по IP/Отпечатку (Мультиаккаунт)");
                    }
                    if (record.hasSuspiciousMods) {
                        warnings.push("Подозрительные моды в античите!");
                    }
                    return warnings.join(" | ");
                };

                const getWarningColor = () => {
                    if (record.hasBannedCoincidences || record.hasSuspiciousMods) {
                        return '#ff4d4f'; // Red for critical security threats
                    }
                    return '#faad14'; // Yellow for minor warnings
                };

                return (
                    <Space size={8}>
                        <Avatar src={record.avatarUrl} size="small">
                            {record.username.substring(0, 1).toUpperCase()}
                        </Avatar>
                        <div>
                            <div className="font-bold text-white hover:text-[#00BFFF] transition-colors flex items-center gap-1.5 text-xs md:text-sm">
                                <span>{record.username}</span>
                                {isSuspicious ? (
                                    <Tooltip title={getWarningTooltip()}>
                                        <WarningOutlined style={{ color: getWarningColor(), fontSize: '13px', cursor: 'help' }} />
                                    </Tooltip>
                                ) : null}
                            </div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span>ID: #{record.id}</span>
                                {record.minecraftNickname && <span className="md:hidden text-gray-400">| {record.minecraftNickname}</span>}
                                <span className="md:hidden text-[#00BFFF]">({record.role.replace('ROLE_', '')})</span>
                            </div>
                        </div>
                    </Space>
                );
            }
        },
        {
            title: 'Minecraft Ник',
            dataIndex: 'minecraftNickname',
            key: 'minecraftNickname',
            responsive: ['md'] as any,
            render: (nick: string) => nick ? <code className="text-gray-300 font-semibold">{nick}</code> : <span className="text-gray-600">—</span>
        },
        {
            title: 'Discord Ник',
            key: 'discordNickname',
            responsive: ['md'] as any,
            render: (_: any, record: User) => {
                if (!record.discordNickname) return <span className="text-gray-600">—</span>;
                return (
                    <Space size={6} align="center">
                        <span className="text-gray-300">{record.discordNickname}</span>
                        <Tooltip title={record.inDiscordServer ? "На Discord сервере" : "Не на Discord сервере"}>
                            <span 
                                className={`text-[12px] leading-none shrink-0 ${record.inDiscordServer ? 'text-indigo-400' : 'text-gray-600 grayscale opacity-40'}`}
                                style={{ cursor: 'default' }}
                            >
                                🌐
                            </span>
                        </Tooltip>
                        <Tooltip title={record.discordVerified ? "Discord аккаунт подтвержден" : "Discord аккаунт не подтвержден"}>
                            {record.discordVerified ? (
                                <span style={{ color: '#52c41a', fontSize: '13px' }}>✓</span>
                            ) : (
                                <span style={{ color: '#595959', opacity: 0.4, fontSize: '13px' }}>✗</span>
                            )}
                        </Tooltip>
                    </Space>
                );
            }
        },
        {
            title: 'Роль',
            dataIndex: 'role',
            key: 'role',
            responsive: ['md'] as any,
            render: (role: string) => {
                const color = role === 'ROLE_ADMIN' ? 'red' : role === 'ROLE_MODERATOR' ? 'purple' : 'blue';
                return <Tag color={color}>{role.replace('ROLE_', '')}</Tag>;
            }
        },
        {
            title: 'Статус',
            key: 'status',
            responsive: ['sm'] as any,
            render: (_: any, record: User) => (
                <Space>
                    {record.banned ? (
                        <Tag color="red">Забанен</Tag>
                    ) : record.isPlayer ? (
                        <Tag color="green">Игрок</Tag>
                    ) : (
                        <Tag color="warning">Зарегистрирован</Tag>
                    )}
                </Space>
            )
        },
        {
            title: 'Варны',
            key: 'warnings',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: User) => {
                const count = record.warningsCount || 0;
                if (count === 0) {
                    return (
                        <Tag 
                            color="default" 
                            style={{ 
                                color: 'rgba(255, 255, 255, 0.45)', 
                                borderColor: 'rgba(255, 255, 255, 0.1)', 
                                background: 'rgba(255, 255, 255, 0.02)',
                                margin: 0
                            }}
                        >
                            0
                        </Tag>
                    );
                }
                return (
                    <Tag 
                        color={count >= 3 ? 'error' : 'warning'} 
                        className="font-bold font-mono"
                        style={{ margin: 0 }}
                    >
                        ⚠️ {count}
                    </Tag>
                );
            }
        }
    ];

    return (
        <div className="space-y-3 animate-fadeIn">
            {/* Filter Section — ultra-compact */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 bg-[#14213d] px-3 py-2 rounded-xl border border-white/5">
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Поиск..."
                        prefix={<SearchOutlined className="text-gray-500" />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        className="text-white rounded-lg"
                        size="small"
                        style={{ height: 28, width: 200, fontSize: 12 }}
                    />
                    <Checkbox
                        checked={statusFilter === 'BANNED'}
                        onChange={e => setStatusFilter(e.target.checked ? 'BANNED' : '')}
                        className="text-gray-300 hover:text-white text-xs select-none"
                    >
                        Забанен
                    </Checkbox>
                    <Checkbox
                        checked={statusFilter === 'WARNED'}
                        onChange={e => setStatusFilter(e.target.checked ? 'WARNED' : '')}
                        className="text-gray-300 hover:text-white text-xs select-none"
                    >
                        С варнами
                    </Checkbox>
                    <Checkbox
                        checked={statusFilter === 'SPONSOR'}
                        onChange={e => setStatusFilter(e.target.checked ? 'SPONSOR' : '')}
                        className="text-gray-300 hover:text-white text-xs select-none"
                    >
                        Спонсоры
                    </Checkbox>
                    <Button type="primary" onClick={handleSearch} size="small" style={{ background: '#00BFFF', borderColor: '#00BFFF', color: '#000', fontWeight: 600, borderRadius: 8, height: 28, fontSize: 12, padding: '0 12px' }}>
                        Найти
                    </Button>
                </div>
                <Button
                    type="primary"
                    ghost
                    icon={<UserAddOutlined />}
                    onClick={() => setIsCreateVisible(true)}
                    size="small"
                    style={{ borderColor: '#00BFFF', color: '#00BFFF', borderRadius: 8, height: 28, fontWeight: 600, fontSize: 12, padding: '0 10px' }}
                    className="hover:bg-[#00BFFF]/10 w-full md:w-auto"
                >
                    Создать
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page + 1,
                        pageSize: pageSize,
                        total: totalElements,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['topRight'],
                        size: 'small',
                        showTotal: (total) => <span className="text-gray-500 text-xs">Всего: {total}</span>
                    }}
                    onChange={handleTableChange}
                    className="custom-table"
                    size="small"
                    onRow={(record) => ({
                        onClick: () => openDossier(record.id),
                        style: { cursor: 'pointer' }
                    })}
                />
            </div>

            {/* Shared Drawer Dossier */}
            <PlayerDossier
                userId={selectedUserId}
                visible={dossierVisible}
                onClose={() => {
                    setDossierVisible(false);
                    setSelectedUserId(null);
                }}
                onUserUpdated={() => fetchUsers()}
            />

            {/* Modal: Create User */}
            <Modal
                title={<span className="text-white font-bold font-minecraft">Создать нового игрока</span>}
                open={isCreateVisible}
                onCancel={() => setIsCreateVisible(false)}
                footer={null}
                className="custom-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleCreateUser} className="pt-4">
                    <Form.Item name="username" label="Имя пользователя (Логин)" rules={[{ required: true, message: 'Обязательное поле' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Обязательное поле' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="email" label="Email почта" rules={[{ required: true, type: 'email', message: 'Введите корректный email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="minecraftNickname" label="Minecraft ник">
                        <Input />
                    </Form.Item>
                    <Form.Item name="discordNickname" label="Discord ник">
                        <Input placeholder="nickname#0000" />
                    </Form.Item>
                    <Form.Item name="role" label="Роль" initialValue="ROLE_USER">
                        <Select>
                            <Option value="ROLE_USER">Игрок (USER)</Option>
                            <Option value="ROLE_MODERATOR">Модератор (MODERATOR)</Option>
                            <Option value="ROLE_ADMIN">Администратор (ADMIN)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="isPlayer" valuePropName="checked" className="mb-4">
                        <Checkbox className="text-gray-300">Статус игрока (isPlayer)</Checkbox>
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsCreateVisible(false)}>Отмена</Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#00BFFF', borderColor: '#00BFFF', color: '#000', fontWeight: 600 }}>Создать</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsersTab;
