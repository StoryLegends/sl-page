import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Modal, Form, Avatar, Descriptions, Alert, Spin, message, Typography } from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    SafetyOutlined,
    DiscordOutlined,
    ClockCircleOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { applicationsApi, type Application } from '../../../api/applications';
import { useAdminWebSocket } from '../../../hooks/useAdminWebSocket';
import PlayerDossier from '../shared/PlayerDossier';

const { Option } = Select;
const { Text, Paragraph } = Typography;

const ApplicationsTab: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');

    // Drawer Dossier
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [dossierVisible, setDossierVisible] = useState(false);

    // View Modal
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isViewVisible, setIsViewVisible] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);

    const [commentForm] = Form.useForm();

    const renderTextWithLinks = (text: string | null | undefined) => {
        if (!text) return '—';
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                const href = part.startsWith('www.') ? `https://${part}` : part;
                return (
                    <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00BFFF] hover:underline break-all"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const fetchApplications = async (currentPage = page, query = searchQuery, status = statusFilter) => {
        setLoading(true);
        try {
            const data = await applicationsApi.getAll(status || undefined, currentPage, pageSize, query || undefined);
            setApplications(data.content);
            setTotalElements(data.totalElements);
        } catch (err) {
            console.error('Failed to fetch applications:', err);
            message.error('Не удалось загрузить список заявок');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchApplications(0, searchQuery, statusFilter);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    useAdminWebSocket({
        '/topic/admin/applications': () => {
            fetchApplications(page, searchQuery, statusFilter);
        }
    });

    const handleSearch = () => {
        fetchApplications(0, searchQuery, statusFilter);
        setPage(0);
    };

    const handleTableChange = (pagination: any) => {
        const newPage = pagination.current - 1;
        const newPageSize = pagination.pageSize;
        setPage(newPage);
        setPageSize(newPageSize);
        fetchApplications(newPage, searchQuery, statusFilter);
    };

    const openDossier = (userId: number) => {
        setSelectedUserId(userId);
        setDossierVisible(true);
    };

    const handleOpenViewModal = async (app: Application) => {
        setViewLoading(true);
        setIsViewVisible(true);
        setSelectedApp(app);
        commentForm.setFieldsValue({ comment: app.adminComment || '' });
        
        try {
            const fullApp = await applicationsApi.getById(app.id);
            setSelectedApp(fullApp);
            commentForm.setFieldsValue({ comment: fullApp.adminComment || '' });
        } catch (err) {
            console.error('Failed to fetch full application details:', err);
            message.error('Не удалось загрузить подробные данные заявки');
        } finally {
            setViewLoading(false);
        }
    };

    const handleUpdateStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!selectedApp) return;
        try {
            const values = await commentForm.validateFields();
            await applicationsApi.updateStatus(selectedApp.id, status, values.comment);
            message.success(`Заявка успешно ${status === 'ACCEPTED' ? 'одобрена' : 'отклонена'}`);
            setIsViewVisible(false);
            fetchApplications();
        } catch (err: any) {
            console.error('Failed to update application status:', err);
            message.error(err.response?.data?.message || 'Не удалось обновить статус заявки');
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Игрок',
            key: 'user',
            render: (_: any, record: Application) => (
                <Space className="cursor-pointer" onClick={() => openDossier(record.user?.id)}>
                    <Avatar src={record.user?.avatarUrl} size="small">
                        {record.user?.username?.substring(0, 1).toUpperCase()}
                    </Avatar>
                    <div>
                        <div className="font-bold text-white hover:text-story-gold transition-colors">{record.user?.username}</div>
                        <div className="text-[10px] text-gray-500">ID: #{record.user?.id}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Имя',
            dataIndex: 'firstName',
            key: 'firstName'
        },
        {
            title: 'Возраст',
            dataIndex: 'age',
            key: 'age',
            render: (age: number) => <Text style={{ color: age < 16 ? '#ff4d4f' : '#fff' }} className="font-bold">{age}</Text>
        },
        {
            title: 'Minecraft ник',
            key: 'minecraft',
            render: (_: any, record: Application) => record.user?.minecraftNickname ? (
                <code className="text-gray-300 font-semibold">{record.user.minecraftNickname}</code>
            ) : <span className="text-gray-600">—</span>
        },
        {
            title: 'Discord ник',
            key: 'discord',
            render: (_: any, record: Application) => record.user?.discordNickname ? (
                <span className="text-gray-400">{record.user.discordNickname}</span>
            ) : <span className="text-gray-600">—</span>
        },
        {
            title: 'Дата подачи',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <Text className="text-gray-500 text-xs font-mono">{new Date(date).toLocaleDateString('ru-RU')}</Text>
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                if (status === 'ACCEPTED') return <Tag color="success">ОДОБРЕНА</Tag>;
                if (status === 'REJECTED') return <Tag color="error">ОТКЛОНЕНА</Tag>;
                return <Tag color="warning" icon={<ClockCircleOutlined />}>В ОЖИДАНИИ</Tag>;
            }
        },
        {
            title: 'Действие',
            key: 'action',
            render: (_: any, record: Application) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    onClick={() => handleOpenViewModal(record)}
                    className="border-story-gold text-story-gold hover:bg-story-gold/10 rounded-xl"
                >
                    Проверить
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-3 bg-[#14213d] p-4 rounded-2xl border border-white/5">
                <Input
                    placeholder="Поиск по логину, имени..."
                    prefix={<SearchOutlined className="text-gray-500" />}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onPressEnter={handleSearch}
                    className="text-white w-full sm:w-64 rounded-xl"
                />
                <Select
                    placeholder="Статус заявки"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full sm:w-44 custom-select"
                    allowClear
                >
                    <Option value="PENDING">В ожидании</Option>
                    <Option value="ACCEPTED">Одобренные</Option>
                    <Option value="REJECTED">Отклоненные</Option>
                    <Option value="">Все заявки</Option>
                </Select>
                <Button type="primary" onClick={handleSearch} className="bg-story-gold text-black font-semibold hover:bg-story-gold-light border-none rounded-xl w-full sm:w-auto">
                    Найти
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <Table
                    dataSource={applications}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page + 1,
                        pageSize: pageSize,
                        total: totalElements,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                    onChange={handleTableChange}
                    className="custom-table"
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
            />

            {/* Modal: View & Moderate Application */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <FileTextOutlined style={{ color: '#FFD700' }} />
                        <span className="text-white font-bold font-minecraft">Проверка заявки #{selectedApp?.id}</span>
                    </div>
                }
                open={isViewVisible}
                onCancel={() => setIsViewVisible(false)}
                footer={null}
                width={850}
                className="custom-modal"
            >
                {selectedApp && (
                    <Spin spinning={viewLoading}>
                        <div className="space-y-6 pt-4 text-gray-200">
                            {/* Connected Data Alerts / Badges */}
                            <div className="space-y-2">
                                {selectedApp.status === 'PENDING' ? (
                                    <>
                                        {/* Discord link status check */}
                                        {selectedApp.user && !selectedApp.user.discordVerified && (
                                            <Alert
                                                message="Discord не верифицирован!"
                                                description="Пользователь еще не прошел OAuth-верификацию в Discord. Одобряйте осторожно."
                                                type="warning"
                                                showIcon
                                                icon={<DiscordOutlined />}
                                                className="border-amber-500/20 bg-amber-950/10 text-amber-200"
                                            />
                                        )}
                                        {/* Discord server status check */}
                                        {selectedApp.user && selectedApp.user.discordVerified && !selectedApp.user.inDiscordServer && (
                                            <Alert
                                                message="Игрок покинул Discord-сервер!"
                                                description="Этот игрок вышел из нашего Discord-сервера. Вы не можете одобрить его заявку, пока он не вернется на сервер."
                                                type="error"
                                                showIcon
                                                icon={<DiscordOutlined />}
                                                className="border-red-500/20 bg-red-950/10 text-red-200"
                                            />
                                        )}
                                    </>
                                ) : selectedApp.status === 'ACCEPTED' ? (
                                    <div className="flex flex-wrap gap-2 p-3 bg-black/10 border border-white/5 rounded-xl">
                                        {selectedApp.user?.discordVerified ? (
                                            <Tag color="success" icon={<CheckOutlined />} className="m-0 border-green-500/20 bg-green-950/20 text-green-400">Дискорд подтвержден</Tag>
                                        ) : (
                                            <Tag color="error" icon={<CloseOutlined />} className="m-0 border-red-500/20 bg-red-950/20 text-red-400">Дискорд не привязан</Tag>
                                        )}
                                        {selectedApp.user?.inDiscordServer ? (
                                            <Tag color="success" icon={<CheckOutlined />} className="m-0 border-green-500/20 bg-green-950/20 text-green-400">На сервере Discord</Tag>
                                        ) : (
                                            <Tag color="error" icon={<CloseOutlined />} className="m-0 border-red-500/20 bg-red-950/20 text-red-400">Покинул сервер Discord</Tag>
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            {/* Details */}
                            <Descriptions bordered column={2} size="small" className="border-white/5 rounded-xl overflow-hidden bg-black/10 text-gray-300">
                                <Descriptions.Item label="ФИО" span={1}>{selectedApp.firstName}</Descriptions.Item>
                                <Descriptions.Item label="Возраст" span={1}>{selectedApp.age} лет</Descriptions.Item>
                                <Descriptions.Item label="Откуда узнали" span={2}>{renderTextWithLinks(selectedApp.source)}</Descriptions.Item>
                                <Descriptions.Item label="Контент-мейкер?" span={1}>{selectedApp.makeContent ? <Tag color="success">Да</Tag> : <Tag color="gray">Нет</Tag>}</Descriptions.Item>
                                <Descriptions.Item label="Оценка адекватности" span={1}>{selectedApp.selfRating} / 10</Descriptions.Item>
                                <Descriptions.Item label="Дополнительно" span={2}>{renderTextWithLinks(selectedApp.additionalInfo)}</Descriptions.Item>
                            </Descriptions>

                            {/* Essay: Why Us */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                                <Text className="text-gray-400 font-bold block">Сочинение: Почему вы хотите играть на нашем сервере?</Text>
                                <Paragraph className="text-white leading-relaxed text-sm whitespace-pre-line" style={{ margin: 0 }}>
                                    {renderTextWithLinks(selectedApp.whyUs)}
                                </Paragraph>
                            </div>

                            {/* User Action buttons */}
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                <Text className="text-gray-400 text-xs">Необходимы другие данные игрока?</Text>
                                <Button
                                    type="link"
                                    icon={<SafetyOutlined />}
                                    onClick={() => {
                                        setIsViewVisible(false);
                                        openDossier(selectedApp.user.id);
                                    }}
                                >
                                    Открыть досье игрока (IP / Мультиаккаунты)
                                </Button>
                            </div>

                            {/* Verdict / Decision Section */}
                            <Form form={commentForm} layout="vertical" className="border-t border-white/5 pt-4">
                                <Form.Item 
                                    name="comment" 
                                    label="Комментарий администратора" 
                                    extra={selectedApp.status === 'PENDING' ? "Будет показан игроку в случае отказа или одобрения." : null}
                                    style={{ marginBottom: '16px' }}
                                >
                                    <Input.TextArea 
                                        rows={selectedApp.status === 'PENDING' ? 3 : 2} 
                                        disabled={selectedApp.status !== 'PENDING'} 
                                        placeholder={selectedApp.status === 'PENDING' ? "Добро пожаловать! / Отклонено: слабое сочинение..." : "Комментарий отсутствует"} 
                                    />
                                </Form.Item>
                                
                                {selectedApp.status === 'PENDING' ? (
                                    <div className="flex justify-end gap-3">
                                        <Button onClick={() => setIsViewVisible(false)}>Закрыть</Button>
                                        <Button
                                            type="primary"
                                            danger
                                            icon={<CloseOutlined />}
                                            onClick={() => handleUpdateStatus('REJECTED')}
                                        >
                                            Отклонить
                                        </Button>
                                        <Button
                                            type="primary"
                                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                            icon={<CheckOutlined />}
                                            onClick={() => handleUpdateStatus('ACCEPTED')}
                                            disabled={selectedApp.user && !selectedApp.user.inDiscordServer}
                                        >
                                            Одобрить
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <Text className="text-gray-500">
                                            Вердикт вынесен: <Tag color={selectedApp.status === 'ACCEPTED' ? 'success' : 'error'}>{selectedApp.status}</Tag>
                                            {selectedApp.handledBy && (
                                                <span className="ml-2 text-xs text-gray-400">
                                                    (Вердикт вынес: <strong className="text-gray-300">{selectedApp.handledBy}</strong>)
                                                </span>
                                            )}
                                        </Text>
                                        <Button onClick={() => setIsViewVisible(false)}>Закрыть</Button>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </Spin>
                )}
            </Modal>
        </div>
    );
};

export default ApplicationsTab;

