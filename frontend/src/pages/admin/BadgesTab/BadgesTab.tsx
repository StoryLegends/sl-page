import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { adminApi } from '../../../api/admin';
import type { Badge } from '../../../api/users';

const BadgesTab: React.FC = () => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [form] = Form.useForm();

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getBadges();
            setBadges(data);
        } catch (err) {
            console.error('Failed to fetch badges:', err);
            message.error('Не удалось загрузить список значков');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBadges();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingBadge(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (badge: Badge) => {
        setEditingBadge(badge);
        form.setFieldsValue({
            name: badge.name,
            color: badge.color,
            svgIcon: badge.svgIcon,
            discordRoleId: (badge as any).discordRoleId || ''
        });
        setIsModalVisible(true);
    };

    const handleSaveBadge = async (values: any) => {
        try {
            if (editingBadge) {
                await adminApi.updateBadge(editingBadge.id, values);
                message.success('Значок успешно обновлен');
            } else {
                await adminApi.createBadge(values);
                message.success('Значок успешно создан');
            }
            setIsModalVisible(false);
            fetchBadges();
        } catch (err) {
            console.error('Failed to save badge:', err);
            message.error('Не удалось сохранить значок');
        }
    };

    const handleDeleteBadge = async (id: number) => {
        try {
            await adminApi.deleteBadge(id);
            message.success('Значок удален');
            fetchBadges();
        } catch (err) {
            console.error('Failed to delete badge:', err);
            message.error('Не удалось удалить значок');
        }
    };

    // Columns config
    const columns = [
        {
            title: 'Название значка',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: Badge) => (
                <Space>
                    {record.svgIcon ? (
                        <div 
                            className="w-6 h-6 badge-icon flex items-center justify-center rounded-md" 
                            style={{ backgroundColor: record.color + '20' }}
                            dangerouslySetInnerHTML={{ __html: record.svgIcon }}
                        />
                    ) : <GiftOutlined style={{ color: record.color }} />}
                    <span className="font-bold text-white">{name}</span>
                </Space>
            )
        },
        {
            title: 'Цвет (Hex)',
            dataIndex: 'color',
            key: 'color',
            render: (color: string) => <Tag color={color}>{color}</Tag>
        },
        {
            title: 'ID Роли Discord',
            dataIndex: 'discordRoleId',
            key: 'discordRoleId',
            render: (id?: string) => id ? <code className="text-gray-400 text-xs">{id}</code> : <span className="text-gray-600">—</span>
        },
        {
            title: 'Дата создания',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date?: string) => date ? new Date(date).toLocaleDateString('ru-RU') : '—'
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: Badge) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleOpenEditModal(record)} 
                        className="text-gray-400 hover:text-white"
                    />
                    <Popconfirm
                        title="Удалить этот значок?"
                        description="Это снимет его со всех игроков, у кого он прикреплен."
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteBadge(record.id)}
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center bg-[#14213d] p-4 rounded-2xl border border-white/5">
                <span className="text-gray-400 font-medium">Значки и достижения для профилей игроков</span>
                <Button
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateModal}
                    className="border-story-gold text-story-gold hover:bg-story-gold/10 rounded-xl font-semibold"
                >
                    Создать значок
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <Table
                    dataSource={badges}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    className="custom-table"
                />
            </div>

            {/* Modal: Create/Edit Badge */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <GiftOutlined style={{ color: '#FFD700' }} />
                        <span className="text-white font-bold font-minecraft">
                            {editingBadge ? 'Редактировать значок' : 'Создать новый значок'}
                        </span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                className="custom-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleSaveBadge} className="pt-4">
                    <Form.Item name="name" label="Название значка" rules={[{ required: true, message: 'Введите название значка' }]}>
                        <Input placeholder="Например: Ветеран 1 Сезона" />
                    </Form.Item>
                    <Form.Item name="color" label="Цвет значка (HEX)" rules={[{ required: true, message: 'Укажите цвет' }]} extra="Например: #FFD700">
                        <Input placeholder="#FFD700" />
                    </Form.Item>
                    <Form.Item name="svgIcon" label="SVG Иконка (Векторный код)" rules={[{ required: true, message: 'Укажите SVG-код' }]} extra="Должен содержать только чистый тег <svg>...</svg>">
                        <Input.TextArea rows={4} placeholder="<svg ...>...</svg>" />
                    </Form.Item>
                    <Form.Item name="discordRoleId" label="ID роли в Discord (опционально)" extra="Если указан, игрокам со значком будет выдаваться соответствующая роль в Discord.">
                        <Input placeholder="1244336090928906351" />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Отмена</Button>
                            <Button type="primary" htmlType="submit" className="bg-story-gold text-black border-none font-semibold">Сохранить</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BadgesTab;

