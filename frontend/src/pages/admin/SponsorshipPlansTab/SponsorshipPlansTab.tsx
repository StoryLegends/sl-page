import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Switch, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Card, InputNumber, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi, type SponsorshipPlan } from '../../../api/admin';
import PlayerDossier from '../shared/PlayerDossier';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  Calendar,
  Layers,
  Settings
} from 'lucide-react';

const SponsorshipPlansTab: React.FC = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SponsorshipPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SponsorshipPlan | null>(null);
    const [form] = Form.useForm();

    // Analytics and settings states
    const [analytics, setAnalytics] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPagination, setHistoryPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [goalForm] = Form.useForm();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [dossierVisible, setDossierVisible] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSponsorshipPlans();
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

    const fetchAnalytics = async () => {
        try {
            const data = await adminApi.getSponsorshipAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
    };

    const fetchHistory = async (page = 0, size = 10) => {
        setHistoryLoading(true);
        try {
            const res = await adminApi.getSponsorshipHistory(page, size);
            setHistory(res.content || []);
            setHistoryPagination({
                current: page + 1,
                pageSize: size,
                total: res.totalElements || 0
            });
        } catch (err) {
            console.error('Failed to fetch purchase history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await adminApi.getSettings();
            goalForm.setFieldsValue({
                sponsorshipGoalEnabled: data.sponsorshipGoalEnabled,
                sponsorshipGoalTarget: data.sponsorshipGoalTarget,
                sponsorshipGoalCurrent: data.sponsorshipGoalCurrent,
                sponsorshipGoalText: data.sponsorshipGoalText
            });
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchAnalytics();
        fetchHistory(0, 10);
        fetchSettings();
    }, []);

    const handleSaveGoalSettings = async (values: any) => {
        setSettingsSaving(true);
        try {
            await adminApi.updateSettings(values);
            message.success('Настройки цели спонсорства сохранены');
            fetchSettings();
            fetchAnalytics(); // Refresh analytics to update graph/current sum
        } catch (err) {
            console.error('Failed to save goal settings:', err);
            message.error('Не удалось сохранить настройки цели');
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleFinishGoal = async () => {
        setSettingsSaving(true);
        try {
            await adminApi.updateSettings({
                sponsorshipGoalEnabled: false,
                sponsorshipGoalCurrent: 0
            });
            message.success('Сбор успешно завершен. Прогресс-бар скрыт.');
            goalForm.setFieldsValue({
                sponsorshipGoalEnabled: false,
                sponsorshipGoalCurrent: 0
            });
            fetchSettings();
            fetchAnalytics();
        } catch (err) {
            console.error('Failed to finish goal:', err);
            message.error('Не удалось завершить сбор');
        } finally {
            setSettingsSaving(false);
        }
    };

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

    // Plans columns
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

    // History columns
    const historyColumns = [
        {
            title: 'Спонсор',
            dataIndex: 'actorUsername',
            key: 'actorUsername',
            render: (username: string, record: any) => {
                const isLetter = record.avatarUrl && record.avatarUrl.length === 1;
                return (
                    <div 
                        className="flex items-center gap-3 text-left cursor-pointer group"
                        onClick={() => {
                            setSelectedUserId(record.actorId);
                            setDossierVisible(true);
                        }}
                    >
                        <Avatar 
                            src={isLetter ? undefined : record.avatarUrl} 
                            size="large"
                            className="bg-legends-blue text-black font-bold shrink-0 border border-white/10"
                            style={{ backgroundColor: '#ffd700', color: '#000' }}
                        >
                            {isLetter ? record.avatarUrl : username.substring(0, 1).toUpperCase()}
                        </Avatar>
                        <div>
                            <div className="font-bold text-white text-sm group-hover:text-[#00BFFF] transition-colors">{username}</div>
                            <div className="text-[10px] text-gray-500">ID: {record.actorId}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Действие',
            dataIndex: 'actionType',
            key: 'actionType',
            render: (actionType: string) => {
                let color = 'blue';
                let label = actionType;
                if (actionType === 'USER_SPONSORSHIP_PAYMENT_SUCCESS') {
                    color = 'green';
                    label = 'Разовая оплата';
                } else if (actionType === 'USER_SPONSORSHIP_SUBSCRIPTION_CREATED') {
                    color = 'purple';
                    label = 'Создание подписки';
                } else if (actionType === 'USER_SPONSORSHIP_RECURRING_BILLING_SUCCESS') {
                    color = 'gold';
                    label = 'Продление подписки';
                }
                return <Tag color={color} className="font-semibold text-xs">{label}</Tag>;
            }
        },
        {
            title: 'Детали платежа',
            dataIndex: 'details',
            key: 'details',
            render: (details: string) => {
                // Shorten or clean details
                const clean = details.split('Действует до')[0].trim();
                return <span className="text-gray-300 text-xs">{clean}</span>;
            }
        },
        {
            title: 'Дата транзакции',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (dateStr: string) => {
                const date = new Date(dateStr);
                return (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {date.toLocaleDateString('ru-RU')} {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                );
            }
        }
    ];

    // SVG Area Chart drawing calculations
    const renderDailyChart = () => {
        if (!analytics || !analytics.dailyRevenue || analytics.dailyRevenue.length === 0) {
            return <div className="text-gray-500 text-center py-10">Нет данных для графика</div>;
        }

        const width = 500;
        const height = 150;
        const padding = 10;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxAmount = Math.max(...analytics.dailyRevenue.map((d: any) => d.amount), 100);

        const points = analytics.dailyRevenue.map((d: any, index: number) => {
            const x = padding + (index / (analytics.dailyRevenue.length - 1)) * chartWidth;
            const y = padding + chartHeight - (d.amount / maxAmount) * chartHeight;
            return { x, y, date: d.date, amount: d.amount };
        });

        const pathD = points.reduce((acc: string, p: any, i: number) => {
            return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
        }, "");

        const areaD = points.length > 0 
            ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
            : "";

        return (
            <div className="relative w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ffd700" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid line (bottom) */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Vertical hover guide line */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <line 
                            x1={points[hoveredIndex].x} 
                            y1={padding} 
                            x2={points[hoveredIndex].x} 
                            y2={height - padding} 
                            stroke="rgba(255, 215, 0, 0.4)" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4" 
                            className="pointer-events-none"
                        />
                    )}

                    {/* Area fill */}
                    {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                    {/* Area line */}
                    {pathD && <path d={pathD} fill="none" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                    {/* Pulsing hover dot */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <circle cx={points[hoveredIndex].x} cy={points[hoveredIndex].y} r="5" fill="#ffd700" stroke="#000" strokeWidth="2" className="pointer-events-none" />
                    )}

                    {/* Static dots */}
                    {points.map((p: any, idx: number) => {
                        if (p.amount === 0) return null;
                        return (
                            <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#ffd700" className="pointer-events-none" />
                        );
                    })}

                    {/* Interactive vertical hover zones */}
                    {points.map((p: any, idx: number) => {
                        const zoneWidth = chartWidth / (points.length - 1);
                        const xStart = p.x - zoneWidth / 2;
                        return (
                            <rect
                                key={`zone-${idx}`}
                                x={xStart}
                                y={0}
                                width={zoneWidth}
                                height={height}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        );
                    })}
                </svg>
                
                {/* Floating tooltip */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                    <div 
                        className="absolute bg-[#0b1320]/95 border border-[#ffd700]/30 rounded-xl p-2.5 text-xs text-white pointer-events-none z-10 transition-all duration-75"
                        style={{
                            left: `${(points[hoveredIndex].x / width) * 100}%`,
                            top: `${(points[hoveredIndex].y / height) * 100}%`,
                            transform: 'translate(-50%, -100%) translateY(-12px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <div className="text-[10px] text-gray-400 font-semibold mb-0.5">{points[hoveredIndex].date}</div>
                        <div className="font-bold text-[#ffd700] text-sm">{points[hoveredIndex].amount} ₽</div>
                    </div>
                )}

                <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-1">
                    <span>{analytics.dailyRevenue[0]?.date}</span>
                    <span>{analytics.dailyRevenue[analytics.dailyRevenue.length - 1]?.date}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 text-white">
            
            {/* Row 1: Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg text-left" bodyStyle={{ padding: '20px' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Общий сбор</p>
                            <h3 className="text-3xl font-extrabold text-white font-minecraft tracking-wider">
                                {analytics ? `${analytics.totalRevenue} ₽` : '...'}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg text-left" bodyStyle={{ padding: '20px' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Прибыль за 30 дней</p>
                            <h3 className="text-3xl font-extrabold text-white font-minecraft tracking-wider">
                                {analytics ? `${analytics.monthlyRevenue} ₽` : '...'}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card 
                    className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg text-left cursor-pointer hover:border-blue-500/30 transition-all duration-300" 
                    bodyStyle={{ padding: '20px' }}
                    onClick={() => navigate('/admin/users?filter=sponsors')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Активные спонсоры</p>
                            <h3 className="text-3xl font-extrabold text-white font-minecraft tracking-wider">
                                {analytics ? `${analytics.activeSubscribers}` : '...'}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Row 2: Analytics Chart & Goal Configurator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* Profit Chart */}
                <Card 
                    title={
                        <span className="font-semibold text-white flex items-center gap-2 text-sm font-minecraft tracking-wide">
                            <Activity className="w-4 h-4 text-amber-500" />
                            График прибыли (за последние 30 дней)
                        </span>
                    }
                    bordered={false}
                    className="bg-[#14213d] border border-white/5 rounded-2xl shadow-xl flex flex-col justify-between"
                >
                    <div className="pt-2">
                        {renderDailyChart()}
                    </div>
                </Card>

                {/* Goal Configurator */}
                <Card 
                    title={
                        <span className="font-semibold text-white flex items-center gap-2 text-sm font-minecraft tracking-wide">
                            <Settings className="w-4 h-4 text-legends-blue" />
                            Конфигуратор цели сбора спонсорства
                        </span>
                    }
                    bordered={false}
                    className="bg-[#14213d] border border-white/5 rounded-2xl shadow-xl text-left"
                >
                    <Form 
                        form={goalForm} 
                        layout="vertical"
                        onFinish={handleSaveGoalSettings}
                    >
                        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-4">
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-white">Отображать цель сбора средств</div>
                                <div className="text-xs text-gray-400">Показывает прогресс-бар сбора на странице спонсорства.</div>
                            </div>
                            <Form.Item name="sponsorshipGoalEnabled" valuePropName="checked" className="mb-0">
                                <Switch />
                            </Form.Item>
                        </div>

                        <Form.Item 
                            name="sponsorshipGoalText" 
                            label="Описание цели сбора"
                            rules={[{ required: true, message: 'Укажите описание цели' }]}
                            className="mb-4"
                        >
                            <Input className="bg-white/5 border-white/10 text-white rounded-lg placeholder-gray-600" placeholder="Например: На оплату хостинга" />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Form.Item 
                                name="sponsorshipGoalCurrent" 
                                label="Текущая сумма (₽)"
                                rules={[{ required: true, message: 'Укажите текущую сумму' }]}
                                className="mb-0"
                            >
                                <InputNumber className="w-full bg-white/5 border-white/10 text-white rounded-lg" placeholder="Например, 1500" />
                            </Form.Item>
                            
                            <Form.Item 
                                name="sponsorshipGoalTarget" 
                                label="Целевая сумма (₽)"
                                rules={[{ required: true, message: 'Укажите целевую сумму' }]}
                                className="mb-0"
                            >
                                <InputNumber className="w-full bg-white/5 border-white/10 text-white rounded-lg" placeholder="Например, 5000" />
                            </Form.Item>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <Popconfirm
                                title="Завершить сбор средств?"
                                description="Это скроет прогресс-бар цели со страницы спонсорства, но сохранит стенд топ-донатеров."
                                onConfirm={handleFinishGoal}
                                okText="Да, завершить"
                                cancelText="Отмена"
                                okButtonProps={{ danger: true }}
                            >
                                <Button 
                                    danger 
                                    ghost
                                    loading={settingsSaving}
                                    className="border-red-500/50 text-red-400 hover:text-red-300 rounded-lg h-9 px-4 transition-all hover:bg-red-500/10"
                                >
                                    Завершить сбор
                                </Button>
                            </Popconfirm>

                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={settingsSaving}
                                className="bg-legends-blue border-none text-black font-semibold hover:opacity-90 rounded-lg h-9 px-5 transition-all shadow-md"
                            >
                                Сохранить цель сбора
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* Row 3: Sponsorship Tariffs Table */}
            <Card 
                title={
                    <div className="flex items-center justify-between text-white py-1">
                        <span className="font-minecraft tracking-wide flex items-center gap-2">
                            <Layers className="text-legends-blue w-5 h-5" />
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
                    rowClassName="hover:bg-white/5 transition-colors text-left"
                />
            </Card>

            {/* Row 4: Purchase History Table */}
            <Card 
                title={
                    <div className="flex items-center gap-2 text-white py-1 font-minecraft tracking-wide text-left">
                        <Calendar className="text-legends-blue w-5 h-5" />
                        История покупок и продлений подписок
                    </div>
                }
                bordered={false}
                className="bg-[#14213d] border border-white/5 rounded-2xl shadow-xl overflow-hidden text-white"
            >
                <Table 
                    dataSource={history} 
                    columns={historyColumns} 
                    rowKey="id"
                    loading={historyLoading}
                    pagination={{
                        current: historyPagination.current,
                        pageSize: historyPagination.pageSize,
                        total: historyPagination.total,
                        onChange: (page, pageSize) => fetchHistory(page - 1, pageSize),
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50']
                    }}
                    className="bg-[#0b1320] rounded-xl overflow-hidden"
                    rowClassName="hover:bg-white/5 transition-colors text-left"
                />
            </Card>

            {/* Existing Tariff Edit/Create Modal */}
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

            {/* Dossier Modal */}
            <PlayerDossier 
                userId={selectedUserId} 
                visible={dossierVisible} 
                onClose={() => {
                    setDossierVisible(false);
                    setSelectedUserId(null);
                }} 
            />
        </div>
    );
};

export default SponsorshipPlansTab;
