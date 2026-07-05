import React, { useEffect, useState } from 'react';
import { Table, Button, Switch, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { adminApi, type FeatureFlag } from '../../../api/admin';

const FeatureFlagsTab: React.FC = () => {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
    const [form] = Form.useForm();

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getFeatureFlags();
            setFlags(data);
        } catch (err) {
            console.error('Failed to fetch feature flags:', err);
            message.error('Не удалось загрузить серверные флаги');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    const handleOpenCreate = () => {
        setEditingFlag(null);
        form.resetFields();
        form.setFieldsValue({
            enabled: false,
            allowAdmins: true,
            allowedUserIds: [],
            allowedRoles: []
        });
        setModalVisible(true);
    };

    const handleOpenEdit = (flag: FeatureFlag) => {
        setEditingFlag(flag);
        form.resetFields();
        form.setFieldsValue({
            ...flag,
            allowedUserIds: flag.allowedUserIds || [],
            allowedRoles: flag.allowedRoles || []
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            // Format ID arrays correctly
            const allowedUserIds = Array.isArray(values.allowedUserIds)
                ? values.allowedUserIds.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id).filter((id: any) => !isNaN(id))
                : [];

            const flagData: FeatureFlag = {
                ...editingFlag,
                name: values.name.trim().toLowerCase(),
                description: values.description,
                enabled: values.enabled,
                allowAdmins: values.allowAdmins,
                allowedUserIds,
                allowedRoles: values.allowedRoles || []
            };

            await adminApi.saveFeatureFlag(flagData);
            message.success(editingFlag ? 'Флаг успешно обновлен' : 'Флаг успешно создан');
            setModalVisible(false);
            fetchFlags();
        } catch (err) {
            console.error('Failed to save feature flag:', err);
            message.error('Не удалось сохранить флаг фичи');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await adminApi.deleteFeatureFlag(id);
            message.success('Флаг фичи успешно удален');
            fetchFlags();
        } catch (err) {
            console.error('Failed to delete feature flag:', err);
            message.error('Не удалось удалить флаг фичи');
        }
    };

    const handleToggleEnabled = async (flag: FeatureFlag, checked: boolean) => {
        try {
            const updated: FeatureFlag = {
                ...flag,
                enabled: checked
            };
            await adminApi.saveFeatureFlag(updated);
            message.success(`Флаг ${flag.name} ${checked ? 'включен' : 'выключен'} глобально`);
            fetchFlags();
        } catch (err) {
            console.error('Failed to toggle feature flag:', err);
            message.error('Не удалось изменить статус флага');
        }
    };

    const columns = [
        {
            title: 'Имя флага (name)',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Tag color="blue" className="font-mono text-xs">{name}</Tag>,
            width: '20%',
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            width: '25%',
        },
        {
            title: 'Глобально',
            key: 'enabled',
            width: '12%',
            render: (_: any, record: FeatureFlag) => (
                <Switch 
                    checked={record.enabled} 
                    onChange={(checked) => handleToggleEnabled(record, checked)} 
                    checkedChildren="ВКЛ" 
                    unCheckedChildren="ВЫКЛ"
                />
            )
        },
        {
            title: 'Админы',
            dataIndex: 'allowAdmins',
            key: 'allowAdmins',
            width: '10%',
            render: (allow: boolean) => (
                <Tag color={allow ? 'green' : 'red'}>{allow ? 'Да' : 'Нет'}</Tag>
            )
        },
        {
            title: 'Разрешенные пользователи (ID)',
            dataIndex: 'allowedUserIds',
            key: 'allowedUserIds',
            width: '18%',
            render: (userIds: number[]) => {
                if (!userIds || userIds.length === 0) return <span className="text-gray-500 text-xs">—</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {userIds.map(id => (
                            <Tag key={id} color="cyan" className="font-mono text-[10px] m-0">{id}</Tag>
                        ))}
                    </div>
                );
            }
        },
        {
            title: 'Роли',
            dataIndex: 'allowedRoles',
            key: 'allowedRoles',
            width: '15%',
            render: (roles: string[]) => {
                if (!roles || roles.length === 0) return <span className="text-gray-500 text-xs">—</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map(r => (
                            <Tag key={r} color="purple" className="text-[10px] m-0">{r.replace('ROLE_', '')}</Tag>
                        ))}
                    </div>
                );
            }
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '10%',
            render: (_: any, record: FeatureFlag) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleOpenEdit(record)} 
                        className="text-gray-400 hover:text-white"
                    />
                    <Popconfirm
                        title="Удалить этот флаг фичи?"
                        description="Это действие нельзя отменить."
                        onConfirm={() => record.id && handleDelete(record.id)}
                        okText="Да, удалить"
                        cancelText="Отмена"
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            className="text-red-400 hover:text-red-300"
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                    <h2 className="text-lg font-bold font-minecraft tracking-wide text-white flex items-center gap-2">
                        <KeyOutlined className="text-legends-blue" />
                        Серверные флаги фич (Feature Flags)
                    </h2>
                    <p className="text-gray-400 text-xs">Управление постепенным развертыванием обновлений для игроков.</p>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleOpenCreate}
                    className="bg-legends-blue text-black border-none font-semibold hover:bg-legends-blue-light rounded-lg flex items-center"
                >
                    Создать флаг
                </Button>
            </div>

            <Card className="bg-[#14213d] border-white/10 rounded-xl" styles={{ body: { padding: 0 } }}>
                <Table 
                    dataSource={flags} 
                    columns={columns} 
                    rowKey="id" 
                    loading={loading}
                    pagination={false}
                    className="custom-admin-table"
                />
            </Card>

            <Modal
                title={
                    <span className="text-white font-bold font-minecraft text-sm">
                        {editingFlag ? 'Редактировать флаг фичи' : 'Создать новый флаг фичи'}
                    </span>
                }
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okText="Сохранить"
                cancelText="Отмена"
                className="custom-modal"
            >
                <Form form={form} layout="vertical" className="pt-4 space-y-3">
                    <Form.Item 
                        name="name" 
                        label={<span className="text-gray-300 font-semibold">Имя флага (системное)</span>} 
                        rules={[{ required: true, message: 'Введите имя флага (например: sponsorship)' }]}
                    >
                        <Input placeholder="sponsorship" className="bg-white/5 border-white/10 text-white rounded-lg" disabled={!!editingFlag} />
                    </Form.Item>

                    <Form.Item 
                        name="description" 
                        label={<span className="text-gray-300 font-semibold">Описание</span>}
                    >
                        <Input.TextArea rows={2} placeholder="Постепенный раскат спонсорства и Stripe оплаты..." className="bg-white/5 border-white/10 text-white rounded-lg resize-none" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Form.Item 
                            name="enabled" 
                            label={<span className="text-gray-300">Включен глобально (для всех)</span>} 
                            valuePropName="checked"
                            className="mb-0"
                        >
                            <Switch checkedChildren="ВКЛ" unCheckedChildren="ВЫКЛ" />
                        </Form.Item>

                        <Form.Item 
                            name="allowAdmins" 
                            label={<span className="text-gray-300">Всегда доступен админам / модераторам</span>} 
                            valuePropName="checked"
                            className="mb-0"
                        >
                            <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                        </Form.Item>
                    </div>

                    <Form.Item 
                        name="allowedUserIds" 
                        label={<span className="text-gray-300 font-semibold">Разрешенные пользователи (ID)</span>}
                        help={<span className="text-gray-500 text-xs">Введите ID игроков (числа), разделяя их Enter или пробелом.</span>}
                    >
                        <Select 
                            mode="tags" 
                            style={{ width: '100%' }} 
                            placeholder="Например: 12, 45, 99"
                            tokenSeparators={[' ', ',']}
                            className="custom-select-tags"
                        />
                    </Form.Item>

                    <Form.Item 
                        name="allowedRoles" 
                        label={<span className="text-gray-300 font-semibold">Разрешенные роли</span>}
                    >
                        <Select 
                            mode="multiple" 
                            style={{ width: '100%' }} 
                            placeholder="Выберите роли"
                        >
                            <Select.Option value="ROLE_USER">Пользователи (ROLE_USER)</Select.Option>
                            <Select.Option value="ROLE_MODERATOR">Модераторы (ROLE_MODERATOR)</Select.Option>
                            <Select.Option value="ROLE_ADMIN">Администраторы (ROLE_ADMIN)</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FeatureFlagsTab;
