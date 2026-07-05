import React, { useEffect, useState } from 'react';
import { Table, Button, Switch, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Card, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { adminApi, type SponsorshipPlan } from '../../../api/admin';

const SponsorshipPlansTab: React.FC = () => {
    const [plans, setPlans] = useState<SponsorshipPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SponsorshipPlan | null>(null);
    const [form] = Form.useForm();

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSponsorshipPlans();
            // Sort by level then days
            data.sort((a: SponsorshipPlan, b: SponsorshipPlan) => {
                if (a.level !== b.level) return a.level - b.level;
                return a.days - b.days;
            });
            setPlans(data);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            message.error('Не удалось загрузить тарифы спонсорства');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenCreate = () => {
        setEditingPlan(null);
        form.resetFields();
        form.setFieldsValue({
            level: 1,
            days: 30,
            price: 99,
            isSubscription: false,
            note: '',
            active: true
        });
        setModalVisible(true);
    };

    const handleOpenEdit = (plan: SponsorshipPlan) => {
        setEditingPlan(plan);
        form.resetFields();
        form.setFieldsValue(plan);
        setModalVisible(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            const planData: SponsorshipPlan = {
                ...editingPlan,
                level: values.level,
                days: values.days,
                price: values.price,
                isSubscription: values.isSubscription,
                note: values.note ? values.note.trim() : '',
                active: values.active !== false
            };

            if (editingPlan && editingPlan.id) {
                await adminApi.updateSponsorshipPlan(editingPlan.id, planData);
                message.success('Тариф успешно обновлен');
            } else {
                await adminApi.createSponsorshipPlan(planData);
                message.success('Тариф успешно создан');
            }
            
            setModalVisible(false);
            fetchPlans();
        } catch (err) {
            console.error('Failed to save sponsorship plan:', err);
            message.error('Не удалось сохранить тариф спонсорства');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await adminApi.deleteSponsorshipPlan(id);
            message.success('Тариф спонсорства успешно удален');
            fetchPlans();
        } catch (err) {
            console.error('Failed to delete plan:', err);
            message.error('Не удалось удалить тариф');
        }
    };

    const handleToggleActive = async (plan: SponsorshipPlan, checked: boolean) => {
        try {
            if (!plan.id) return;
            const updated: SponsorshipPlan = {
                ...plan,
                active: checked
            };
            await adminApi.updateSponsorshipPlan(plan.id, updated);
            message.success(`Тариф ${plan.isSubscription ? 'Подписки' : 'Оплаты'} Уровня ${plan.level} на ${plan.days} дней ${checked ? 'активирован' : 'деактивирован'}`);
            fetchPlans();
        } catch (err) {
            console.error('Failed to toggle active state:', err);
            message.error('Не удалось обновить статус тарифа');
        }
    };

    const columns = [
        {
            title: 'Уровень',
            dataIndex: 'level',
            key: 'level',
            width: '12%',
            render: (level: number) => {
                let color = 'blue';
                if (level === 2) color = 'purple';
                if (level === 3) color = 'gold';
                return <Tag color={color} className="font-bold">Уровень {level}</Tag>;
            }
        },
        {
            title: 'Срок (дней)',
            dataIndex: 'days',
            key: 'days',
            width: '12%',
            render: (days: number) => <span className="font-semibold text-white">{days} дней</span>
        },
        {
            title: 'Цена (Р)',
            dataIndex: 'price',
            key: 'price',
            width: '15%',
            render: (price: number) => <span className="font-bold text-story-gold text-lg">{price} ₽</span>
        },
        {
            title: 'Тип оплаты',
            dataIndex: 'isSubscription',
            key: 'isSubscription',
            width: '18%',
            render: (sub: boolean) => (
                <Tag color={sub ? 'cyan' : 'magenta'}>
                    {sub ? 'Автопродление' : 'Разовый платёж'}
                </Tag>
            )
        },
        {
            title: 'Примечание',
            dataIndex: 'note',
            key: 'note',
            width: '25%',
            render: (note: string) => <span className="text-gray-300 text-sm">{note || '—'}</span>
        },
        {
            title: 'Статус',
            key: 'active',
            width: '10%',
            render: (_: any, record: SponsorshipPlan) => (
                <Switch 
                    checked={record.active} 
                    onChange={(checked) => handleToggleActive(record, checked)} 
                    checkedChildren="ВКЛ" 
                    unCheckedChildren="ВЫКЛ"
                />
            )
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '15%',
            render: (_: any, record: SponsorshipPlan) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<EditOutlined className="text-blue-400" />} 
                        onClick={() => handleOpenEdit(record)}
                    />
                    <Popconfirm
                        title="Удалить данный тариф?"
                        description="Это действие нельзя отменить."
                        onConfirm={() => record.id && handleDelete(record.id)}
                        okText="Да, удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
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
        <Card 
            title={
                <div className="flex items-center justify-between text-white py-1">
                    <span className="font-minecraft tracking-wide flex items-center gap-2">
                        <GiftOutlined className="text-legends-blue" />
                        Управление тарифами спонсорства
                    </span>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleOpenCreate}
                        className="bg-legends-blue border-none hover:opacity-90"
                    >
                        Добавить тариф
                    </Button>
                </div>
            }
            bordered={false}
            className="bg-[#14213d] border border-white/5 rounded-2xl shadow-xl overflow-hidden text-white"
        >
            <Table 
                dataSource={plans} 
                columns={columns} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 15 }}
                className="bg-[#0b1320] rounded-xl overflow-hidden"
                rowClassName="hover:bg-white/5 transition-colors"
            />

            <Modal
                title={editingPlan ? 'Редактировать тариф' : 'Добавить новый тариф'}
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okText="Сохранить"
                cancelText="Отмена"
                destroyOnClose
                className="admin-modal"
            >
                <Form 
                    form={form} 
                    layout="vertical"
                    className="pt-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="level" 
                            label="Уровень спонсорства" 
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Select.Option value={1}>Уровень 1</Select.Option>
                                <Select.Option value={2}>Уровень 2</Select.Option>
                                <Select.Option value={3}>Уровень 3</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item 
                            name="days" 
                            label="Срок действия (дней)" 
                            rules={[{ required: true, message: 'Укажите срок действия' }]}
                        >
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="price" 
                            label="Цена (Рублей)" 
                            rules={[{ required: true, message: 'Укажите цену' }]}
                        >
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>

                        <Form.Item 
                            name="isSubscription" 
                            label="Тип оплаты" 
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Select.Option value={false}>Разовый платёж</Select.Option>
                                <Select.Option value={true}>Автопродление (Подписка)</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item 
                        name="note" 
                        label="Примечание на карточке (необязательно)"
                    >
                        <Input placeholder="Например: 99 ₽ / месяц (Автопродление)" />
                    </Form.Item>

                    <Form.Item 
                        name="active" 
                        label="Доступен для покупки" 
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default SponsorshipPlansTab;
