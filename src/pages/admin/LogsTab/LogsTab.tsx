import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Tag, Typography, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminApi, type AuditLog } from '../../../api/admin';

const { Text } = Typography;

const LogsTab: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async (currentPage = page, query = searchQuery) => {
        setLoading(true);
        try {
            const data = await adminApi.getLogs(query || undefined, currentPage, pageSize);
            setLogs(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            message.error('Не удалось загрузить логи аудита');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(0, searchQuery);
        setPage(0);
    }, []);

    const handleSearch = () => {
        fetchLogs(0, searchQuery);
        setPage(0);
    };

    const handleTableChange = (pagination: any) => {
        const newPage = pagination.current - 1;
        setPage(newPage);
        fetchLogs(newPage, searchQuery);
    };

    // Columns config
    const columns = [
        {
            title: 'Время',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <Text className="text-gray-500 text-xs font-mono">{new Date(date).toLocaleString('ru-RU')}</Text>
        },
        {
            title: 'Действие',
            dataIndex: 'actionType',
            key: 'actionType',
            render: (type: string) => <Tag color="cyan">{type}</Tag>
        },
        {
            title: 'Администратор',
            dataIndex: 'actorUsername',
            key: 'actorUsername',
            render: (username: string) => <Text style={{ color: '#fff' }} className="font-bold">{username}</Text>
        },
        {
            title: 'Детали',
            dataIndex: 'details',
            key: 'details',
            render: (text: string) => <Text style={{ color: 'rgba(255,255,255,0.75)' }} className="text-xs leading-relaxed">{text}</Text>
        },
        {
            title: 'Цель',
            dataIndex: 'targetUsername',
            key: 'targetUsername',
            render: (username: string) => username ? <Tag color="blue">{username}</Tag> : <span className="text-gray-600">—</span>
        },
        {
            title: 'IP Адрес',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            render: (ip: string) => ip ? <code className="text-gray-400 text-xs font-mono">{ip}</code> : <span className="text-gray-600">—</span>
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14213d] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Input
                        placeholder="Поиск по действию, админу, деталям..."
                        prefix={<SearchOutlined className="text-gray-500" />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        className="text-white w-full sm:w-80 rounded-xl"
                    />
                    <Button type="primary" onClick={handleSearch} className="bg-story-gold text-black font-semibold hover:bg-story-gold-light border-none rounded-xl">
                        Найти
                    </Button>
                </div>
                <Button 
                    type="default" 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchLogs(page, searchQuery)}
                    loading={loading}
                    className="border-white/10 hover:border-story-gold text-gray-300 hover:text-story-gold bg-transparent rounded-xl"
                >
                    Обновить
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <Table
                    dataSource={logs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page + 1,
                        pageSize: pageSize,
                        total: totalElements,
                        showSizeChanger: false
                    }}
                    onChange={handleTableChange}
                    className="custom-table"
                />
            </div>
        </div>
    );
};

export default LogsTab;

