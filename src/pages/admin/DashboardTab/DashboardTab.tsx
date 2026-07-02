import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Button, List, Avatar, Space, Badge, message } from 'antd';
import {
    UserOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ArrowRightOutlined,
    ReloadOutlined,
    SafetyOutlined,
    HistoryOutlined,
    WarningOutlined,
    UserSwitchOutlined,
    ClockCircleOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminApi, anticheatApi, type DashboardStats } from '../../../api/admin';
import { useAdminWebSocket } from '../../../hooks/useAdminWebSocket';
import PlayerDossier from '../shared/PlayerDossier';

const { Title, Paragraph } = Typography;

interface SuspiciousAction {
    key: string;
    type: 'anticheat' | 'clone' | 'ban' | 'warn';
    title: string;
    description: string;
    playerName: string;
    userId?: number;
    timestamp: string;
    snapshotId?: number;
}

const DashboardTab: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Suspicious actions states
    const [suspiciousActions, setSuspiciousActions] = useState<SuspiciousAction[]>([]);
    const [actionsLoading, setActionsLoading] = useState(false);

    // Player Dossier states
    const [dossierUserId, setDossierUserId] = useState<number | null>(null);
    const [dossierVisible, setDossierVisible] = useState(false);
    const [dossierInitialTab, setDossierInitialTab] = useState('general');

    const fetchStats = async () => {
        setError(null);
        try {
            const data = await adminApi.getStats();
            setStats(data);
        } catch (err: any) {
            console.error('Failed to fetch dashboard stats:', err);
            setError('Не удалось загрузить статистику. Пожалуйста, попробуйте позже.');
        }
    };

    const fetchSuspiciousActions = async () => {
        setActionsLoading(true);
        try {
            const actions: SuspiciousAction[] = [];

            // 1. Fetch latest anticheat snapshots (limit to 30)
            try {
                const snapData = await anticheatApi.getAllSnapshots(undefined, 0, 30);
                const snapshotsList = snapData.content || [];
                snapshotsList.forEach(s => {
                    const hasSuspiciousMods = s.mods?.some(m => m.status === 'SUSPICIOUS');
                    if (s.suspicious || hasSuspiciousMods) {
                        const scorePercent = s.anomalyScore ? Math.round(s.anomalyScore * 100) : 0;
                        const suspiciousModList = s.mods?.filter(m => m.status === 'SUSPICIOUS').map(m => m.name) || [];
                        actions.push({
                            key: `anticheat-${s.id}`,
                            type: 'anticheat',
                            title: 'Аномалия в античите',
                            description: hasSuspiciousMods 
                                ? `Подозрительные моды: ${suspiciousModList.join(', ')}` 
                                : `Подозрительные процессы. Коэффициент: ${scorePercent}%`,
                            playerName: s.playerName,
                            timestamp: s.createdAt,
                            snapshotId: s.id
                        });
                    }
                });
            } catch (err) {
                console.error('Failed to fetch anticheat snapshots in dashboard:', err);
            }

            // 2. Fetch latest registered users (limit to 5) and check related accounts
            try {
                const usersData = await adminApi.getAllUsers(0, 5);
                const recentUsers = usersData.content || [];
                
                const relatedAccPromises = recentUsers.map(async (u) => {
                    try {
                        const related = await adminApi.getRelatedAccounts(u.id);
                        if (related && related.length > 0) {
                            const bannedRelated = related.filter(a => a.banned);
                            const hasCanvasMatch = related.some(r => 
                                (r.registrationCanvas && r.registrationCanvas !== 'unknown' && (r.registrationCanvas === u.registrationCanvas || r.registrationCanvas === u.lastLoginCanvas1 || r.registrationCanvas === u.lastLoginCanvas2)) ||
                                (r.lastLoginCanvas1 && r.lastLoginCanvas1 !== 'unknown' && (r.lastLoginCanvas1 === u.registrationCanvas || r.lastLoginCanvas1 === u.lastLoginCanvas1 || r.lastLoginCanvas1 === u.lastLoginCanvas2))
                            );
                            const matchType = hasCanvasMatch ? 'IP/Отпечатку' : 'IP';

                            actions.push({
                                key: `clone-${u.id}`,
                                type: 'clone',
                                title: `Совпадение по ${matchType} (Мультиаккаунт)`,
                                description: `Найдено совпадение по ${matchType} с другими аккаунтами (${related.length} шт.)${bannedRelated.length > 0 ? `, включая забаненные: ${bannedRelated.length} шт.` : ''}`,
                                playerName: u.minecraftNickname || u.username,
                                userId: u.id,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (e) {
                        // Silent catch for related accounts
                    }
                });
                await Promise.all(relatedAccPromises);
            } catch (err) {
                console.error('Failed to fetch users in dashboard:', err);
            }

            // 3. Fetch audit logs (limit to 30) for bans/warnings
            try {
                const logsData = await adminApi.getLogs(undefined, 0, 30);
                const modLogs = (logsData.content || []).filter(
                    log => log.actionType === 'BAN_USER' || log.actionType === 'WARN_USER'
                );
                modLogs.forEach(log => {
                    actions.push({
                        key: `audit-${log.id}`,
                        type: log.actionType === 'BAN_USER' ? 'ban' : 'warn',
                        title: log.actionType === 'BAN_USER' ? 'Блокировка игрока' : 'Предупреждение игрока',
                        description: log.details,
                        playerName: log.targetUsername || 'Неизвестный',
                        userId: log.targetUserId || undefined,
                        timestamp: log.createdAt
                    });
                });
            } catch (err) {
                console.error('Failed to fetch audit logs in dashboard:', err);
            }

            // Sort actions by timestamp desc
            actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setSuspiciousActions(actions.slice(0, 10)); // Top 10 items
        } catch (err) {
            console.error('Failed to fetch suspicious actions:', err);
        } finally {
            setActionsLoading(false);
        }
    };

    const loadDashboardData = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchSuspiciousActions()]);
        setLoading(false);
    };

    const handleReload = async () => {
        await Promise.all([fetchStats(), fetchSuspiciousActions()]);
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    useAdminWebSocket({
        '/topic/admin/applications': () => {
            fetchStats();
        },
        '/topic/admin/users': () => {
            fetchStats();
        },
        '/topic/admin/messenger': () => {
            fetchStats();
        }
    });

    const handleOpenUserDossier = async (action: SuspiciousAction) => {
        if (action.userId) {
            setDossierUserId(action.userId);
            setDossierInitialTab(action.type === 'anticheat' ? 'anticheat' : 'general');
            setDossierVisible(true);
        } else {
            // Find by playerName
            setLoading(true);
            try {
                const res = await adminApi.getAllUsers(0, 5, action.playerName);
                const foundUser = res.content?.find(
                    u => u.minecraftNickname?.toLowerCase() === action.playerName.toLowerCase() || 
                         u.username.toLowerCase() === action.playerName.toLowerCase()
                );
                if (foundUser) {
                    setDossierUserId(foundUser.id);
                    setDossierInitialTab(action.type === 'anticheat' ? 'anticheat' : 'general');
                    setDossierVisible(true);
                } else {
                    message.warning(`Пользователь с ником ${action.playerName} не найден в базе.`);
                }
            } catch (err) {
                console.error('Failed to find user for dossier:', err);
                message.error('Не удалось открыть профиль игрока');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin size="large" tip="Загрузка статистики..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Title level={2} style={{ margin: 0, color: '#fff' }} className="font-minecraft">
                        Панель управления <span className="text-story-gold">StoryLegends</span>
                    </Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.65)', margin: '4px 0 0 0' }}>
                        Добро пожаловать в административный интерфейс проекта. Здесь вы можете управлять заявками, пользователями и античитом.
                    </Paragraph>
                </div>
                <Button 
                    type="default" 
                    icon={<ReloadOutlined />} 
                    onClick={handleReload}
                    loading={loading}
                    className="border-white/10 hover:border-story-gold text-gray-300 hover:text-story-gold bg-transparent rounded-xl"
                >
                    Обновить данные
                </Button>
            </div>

            {error && (
                <Alert
                    message="Ошибка"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    className="border-red-500/20 bg-red-950/20 text-red-200 rounded-xl"
                />
            )}

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/users')}
                        className="bg-[#14213d] border border-white/5 hover:border-blue-500/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-blue-400 transition-colors">Всего игроков</span>}
                                value={stats?.totalUsers}
                                valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform">
                                <UserOutlined style={{ fontSize: 18, color: '#00BFFF' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-blue-400 transition-colors">
                            <span>Все игроки</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/applications')}
                        className="bg-[#14213d] border border-white/5 hover:border-story-gold/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-story-gold transition-colors">Заявок на проверку</span>}
                                value={stats?.pendingApplications}
                                valueStyle={{ color: '#FFD700', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform">
                                <FileTextOutlined style={{ fontSize: 18, color: '#FFD700' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-story-gold transition-colors">
                            <span>Перейти к заявкам</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/users')}
                        className="bg-[#14213d] border border-white/5 hover:border-green-500/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-green-400 transition-colors">Активные игроки</span>}
                                value={stats?.activePlayers}
                                valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/10 group-hover:scale-110 transition-transform">
                                <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-green-400 transition-colors">
                            <span>Список игроков</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/users')}
                        className="bg-[#14213d] border border-white/5 hover:border-red-500/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-red-400 transition-colors">Забанено</span>}
                                value={stats?.bannedUsers}
                                valueStyle={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10 group-hover:scale-110 transition-transform">
                                <StopOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-red-400 transition-colors">
                            <span>Забаненные</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/messenger')}
                        className="bg-[#14213d] border border-white/5 hover:border-sky-400/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-sky-400 transition-colors">Непрочитанные СМС</span>}
                                value={stats?.unreadMessagesCount ?? stats?.playerMessagesCount ?? 0}
                                valueStyle={{ color: (stats?.unreadMessagesCount ?? 0) > 0 ? '#f59e0b' : '#38bdf8', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/10 group-hover:scale-110 transition-transform">
                                <MessageOutlined style={{ fontSize: 18, color: '#38bdf8' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-sky-400 transition-colors">
                            <span>Открыть мессенджер</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={4}>
                    <Card 
                        hoverable
                        onClick={() => navigate('/admin/users')}
                        className="bg-[#14213d] border border-white/5 hover:border-amber-400/30 transition-all rounded-2xl overflow-hidden cursor-pointer shadow-lg group h-full flex flex-col justify-between"
                        styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                        <div className="flex items-center justify-between">
                            <Statistic
                                title={<span className="text-gray-400 text-xs font-medium group-hover:text-amber-400 transition-colors">Активных варнов</span>}
                                value={stats?.activeWarningsCount ?? 0}
                                valueStyle={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 24 }}
                            />
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform">
                                <WarningOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-amber-400 transition-colors">
                            <span>Все игроки</span>
                            <ArrowRightOutlined className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Dashboard Content split: Left (Suspicious feed), Right (Quick actions) */}
            <Row gutter={[20, 20]}>
                {/* Suspicious Actions Feed */}
                <Col xs={24} lg={16}>
                    <Card 
                        className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg font-sans"
                        title={
                            <div className="flex items-center gap-2 text-red-400 font-bold font-minecraft text-lg">
                                <WarningOutlined />
                                <span>Подозрительная активность</span>
                            </div>
                        }
                    >
                        {actionsLoading && suspiciousActions.length === 0 ? (
                            <div className="py-12 text-center"><Spin tip="Загрузка активности..." /></div>
                        ) : (
                            <List
                                loading={actionsLoading}
                                dataSource={suspiciousActions}
                                locale={{ emptyText: <Alert message="Подозрительная активность не обнаружена" type="success" showIcon className="border-green-500/10 bg-green-950/10 text-green-200 rounded-xl" /> }}
                                renderItem={(action) => {
                                    let icon = <WarningOutlined className="text-orange-400" />;
                                    let badgeColor = 'orange';
                                    if (action.type === 'anticheat') {
                                        icon = <SafetyOutlined className="text-red-400" />;
                                        badgeColor = 'red';
                                    } else if (action.type === 'clone') {
                                        icon = <UserSwitchOutlined className="text-amber-400" />;
                                        badgeColor = 'gold';
                                    } else if (action.type === 'ban') {
                                        icon = <StopOutlined className="text-red-500" />;
                                        badgeColor = 'error';
                                    } else if (action.type === 'warn') {
                                        icon = <WarningOutlined className="text-orange-400" />;
                                        badgeColor = 'warning';
                                    }

                                    return (
                                        <List.Item
                                            className="px-4 py-3 border-b border-white/5 flex items-center justify-between hover:bg-[#00BFFF]/5 cursor-pointer rounded-xl transition-all duration-200 group"
                                            onClick={() => handleOpenUserDossier(action)}
                                            style={{ marginBottom: 8, border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.15)' }}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar 
                                                        icon={icon} 
                                                        style={{ 
                                                            backgroundColor: 'rgba(0, 191, 255, 0.05)', 
                                                            border: '1px solid rgba(0, 191, 255, 0.15)' 
                                                        }} 
                                                    />
                                                }
                                                title={
                                                    <Space>
                                                        <span className="text-white font-bold group-hover:text-[#00BFFF] transition-colors">{action.title}</span>
                                                        <Badge status={badgeColor as any} />
                                                    </Space>
                                                }
                                                description={
                                                    <div className="space-y-1">
                                                        <div className="text-gray-300 text-xs">{action.description}</div>
                                                        <div className="text-gray-500 text-[10px] flex items-center gap-2 mt-1">
                                                            <span>Игрок: <strong className="text-gray-400">{action.playerName}</strong></span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <ClockCircleOutlined />
                                                                {new Date(action.timestamp).toLocaleString('ru-RU')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                            <Button 
                                                type="text" 
                                                icon={<ArrowRightOutlined className="text-gray-500 group-hover:text-[#00BFFF] group-hover:translate-x-1 transition-all" />} 
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        )}
                    </Card>
                </Col>

                {/* Quick Actions Panel */}
                <Col xs={24} lg={8}>
                    <Card 
                        className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg"
                        title={<span className="text-white font-bold font-minecraft text-lg">Быстрые действия</span>}
                    >
                        <div className="space-y-4">
                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                <Title level={5} style={{ color: '#fff', margin: 0 }}>Модерация</Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 16px 0', fontSize: 13 }}>
                                    Проверка и вынесение вердиктов по новым заявкам игроков.
                                </Paragraph>
                                <Button 
                                    type="primary" 
                                    ghost 
                                    icon={<FileTextOutlined />} 
                                    onClick={() => navigate('/admin/applications')}
                                    className="border-story-gold text-story-gold hover:bg-story-gold/10 w-full"
                                >
                                    Открыть заявки
                                </Button>
                            </div>
                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                <Title level={5} style={{ color: '#fff', margin: 0 }}>Безопасность</Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 16px 0', fontSize: 13 }}>
                                    Просмотр снапшотов античита игроков и ведение списка доверенных модов.
                                </Paragraph>
                                <Button 
                                    type="primary" 
                                    ghost 
                                    icon={<SafetyOutlined />} 
                                    onClick={() => navigate('/admin/anticheat')}
                                    className="border-story-gold text-story-gold hover:bg-story-gold/10 w-full"
                                >
                                    Открыть античит
                                </Button>
                            </div>
                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                <Title level={5} style={{ color: '#fff', margin: 0 }}>Аудит</Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 16px 0', fontSize: 13 }}>
                                    Просмотр логов действий администрации для контроля безопасности.
                                </Paragraph>
                                <Button 
                                    type="primary" 
                                    ghost 
                                    icon={<HistoryOutlined />} 
                                    onClick={() => navigate('/admin/logs')}
                                    className="border-story-gold text-story-gold hover:bg-story-gold/10 w-full"
                                >
                                    Проверить логи
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Dossier Drawer */}
            <PlayerDossier
                userId={dossierUserId}
                visible={dossierVisible}
                initialTab={dossierInitialTab}
                onClose={() => setDossierVisible(false)}
                onUserUpdated={handleReload}
            />
        </div>
    );
};

export default DashboardTab;
