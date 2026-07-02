import React, { useEffect, useState } from 'react';
import { Drawer, Tabs, Descriptions, Table, Tag, Typography, Spin, Alert, Button, Space, Avatar, Badge, Divider, Tooltip, List, Modal, Form, Input, Checkbox, Switch, Dropdown, Select, message } from 'antd';
import {
    SafetyOutlined,
    CopyOutlined,
    StopOutlined,
    CheckCircleOutlined,
    EditOutlined,
    WarningOutlined,
    KeyOutlined,
    DeleteOutlined,
    UnlockOutlined,
    DownOutlined,
    UserSwitchOutlined,
    SearchOutlined,
    FileTextOutlined,
    CheckOutlined,
    CloseOutlined,
    DiscordOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { adminApi, anticheatApi, knownModsApi, type AuditLog, type WarningResponse, type AnticheatSnapshot, type ProcessInfo, type ModEntry } from '../../../api/admin';
import { applicationsApi, type Application } from '../../../api/applications';
import type { User, Badge as ApiBadge } from '../../../api/users';
import IPGeoInfo from './IPGeoInfo';
import { useAuth } from '../../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface PlayerDossierProps {
    userId: number | null;
    visible: boolean;
    onClose: () => void;
    onUserUpdated?: () => void;
    onSendMessage?: (userId: number) => void;
    initialTab?: string;
}

const PlayerDossier: React.FC<PlayerDossierProps> = ({ userId, visible, onClose, onUserUpdated, onSendMessage, initialTab }) => {
    const { isAdmin } = useAuth();
    const [activeUserId, setActiveUserId] = useState<number | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sub-data states
    const [warnings, setWarnings] = useState<WarningResponse[]>([]);
    const [relatedAccounts, setRelatedAccounts] = useState<User[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditLogsPage, setAuditLogsPage] = useState(0);
    const [auditLogsHasMore, setAuditLogsHasMore] = useState(true);
    const [auditLogsLoadingMore, setAuditLogsLoadingMore] = useState(false);
    const [snapshots, setSnapshots] = useState<AnticheatSnapshot[]>([]);

    // Loading states for tabs
    const [warningsLoading, setWarningsLoading] = useState(false);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [appsLoading, setAppsLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [snapshotsLoading, setSnapshotsLoading] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('general');

    // Anticheat snapshot detail modal states
    const [selectedSnapshot, setSelectedSnapshot] = useState<AnticheatSnapshot | null>(null);
    const [isSnapModalVisible, setIsSnapModalVisible] = useState(false);
    const [snapDetailsLoading, setSnapDetailsLoading] = useState(false);
    const [processSearch, setProcessSearch] = useState('');
    const [innerModSearch, setInnerModSearch] = useState('');

    // Application view modal states
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isAppViewVisible, setIsAppViewVisible] = useState(false);
    const [appViewLoading, setAppViewLoading] = useState(false);
    const [appCommentForm] = Form.useForm();

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

    const handleOpenSnapModal = async (snapshot: AnticheatSnapshot) => {
        setSelectedSnapshot(snapshot);
        setIsSnapModalVisible(true);
        setSnapDetailsLoading(true);
        setProcessSearch('');
        setInnerModSearch('');
        try {
            const fullData = await anticheatApi.getSnapshot(snapshot.id, true);
            setSelectedSnapshot(fullData);
        } catch (err) {
            console.error('Failed to load snapshot details in dossier:', err);
            message.error('Не удалось загрузить детали снапшота');
        } finally {
            setSnapDetailsLoading(false);
        }
    };

    const handleUpdateModStatus = async (modName: string, status: 'TRUSTED' | 'SUSPICIOUS' | 'UNKNOWN') => {
        try {
            if (status === 'UNKNOWN') {
                await knownModsApi.deleteByName(modName);
                message.success(`Статус мода "${modName}" сброшен`);
            } else {
                await knownModsApi.save({ name: modName, status });
                message.success(`Статус мода "${modName}" обновлен на ${status === 'TRUSTED' ? 'ДОВЕРЕННЫЙ' : 'ПОДОЗРИТЕЛЬНЫЙ'}`);
            }
            if (selectedSnapshot) {
                const updated = await anticheatApi.getSnapshot(selectedSnapshot.id, false);
                setSelectedSnapshot(updated);
            }
        } catch (err) {
            console.error('Failed to update mod status:', err);
            message.error('Не удалось обновить статус мода');
        }
    };

    // Modal states
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [availableBadges, setAvailableBadges] = useState<ApiBadge[]>([]);
    const [isBanVisible, setIsBanVisible] = useState(false);
    const [isWarnVisible, setIsWarnVisible] = useState(false);
    const [isPlayerToggling, setIsPlayerToggling] = useState(false);

    // Forms
    const [editForm] = Form.useForm();
    const [banForm] = Form.useForm();
    const [warnForm] = Form.useForm();

    useEffect(() => {
        const fetchAllBadges = async () => {
            try {
                const data = await adminApi.getBadges();
                setAvailableBadges(data);
            } catch (err) {
                console.error('Failed to fetch badges list:', err);
            }
        };
        fetchAllBadges();
    }, []);

    useEffect(() => {
        if (visible && userId) {
            setActiveUserId(userId);
        } else if (!visible) {
            setActiveUserId(null);
        }
    }, [userId, visible]);

    useEffect(() => {
        if (visible && activeUserId) {
            loadUserProfile(activeUserId);
            adminApi.logDossierView(activeUserId).catch(err => console.error('Failed to log dossier view:', err));
        }
    }, [activeUserId, visible]);

    useEffect(() => {
        if (visible) {
            setActiveTab(initialTab || 'general');
        }
    }, [visible, initialTab]);

    const loadUserProfile = async (id: number) => {
        setLoading(true);
        setError(null);
        setRelatedLoading(true);
        try {
            const data = await adminApi.getUser(id);
            setUser(data);
            
            // Load related accounts first, so we can use them for merged audit logs
            const related = await adminApi.getRelatedAccounts(id);
            setRelatedAccounts(related);
            setRelatedLoading(false);

            // Fetch other details
            fetchWarnings(id);
            fetchApplications(data.username);
            fetchAuditLogs(id, 0);
            fetchAnticheatSnapshots(data, related);
        } catch (err: any) {
            console.error('Failed to load user profile in dossier:', err);
            setError('Не удалось загрузить досье пользователя');
            setRelatedLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchWarnings = async (id: number) => {
        setWarningsLoading(true);
        try {
            const data = await adminApi.getWarnings(id);
            setWarnings(data);
        } catch (err) {
            console.error('Failed to fetch warnings in dossier:', err);
        } finally {
            setWarningsLoading(false);
        }
    };

    const fetchApplications = async (username: string) => {
        setAppsLoading(true);
        try {
            const data = await applicationsApi.getAll(undefined, 0, 10, username);
            setApplications(data.content || []);
        } catch (err) {
            console.error('Failed to fetch applications in dossier:', err);
        } finally {
            setAppsLoading(false);
        }
    };

    const fetchAuditLogs = async (targetId: number, pageToFetch = 0) => {
        if (pageToFetch === 0) {
            setLogsLoading(true);
            setAuditLogsPage(0);
        } else {
            setAuditLogsLoadingMore(true);
        }
        try {
            const res = await adminApi.getUserAuditLogs(targetId, pageToFetch, 20);
            const newLogs = res.content || [];
            if (pageToFetch === 0) {
                setAuditLogs(newLogs);
            } else {
                setAuditLogs(prev => {
                    const existingIds = new Set(prev.map(l => l.id));
                    const uniqueNew = newLogs.filter(l => !existingIds.has(l.id));
                    return [...prev, ...uniqueNew];
                });
            }
            setAuditLogsHasMore(pageToFetch < res.totalPages - 1);
            setAuditLogsPage(pageToFetch);
        } catch (err) {
            console.error('Failed to fetch audit logs in dossier:', err);
        } finally {
            setLogsLoading(false);
            setAuditLogsLoadingMore(false);
        }
    };

    const loadMoreAuditLogs = () => {
        if (activeUserId && auditLogsHasMore && !auditLogsLoadingMore && !logsLoading) {
            fetchAuditLogs(activeUserId, auditLogsPage + 1);
        }
    };

    const fetchAnticheatSnapshots = async (mainUser: User, relatedList: User[]) => {
        setSnapshotsLoading(true);
        try {
            const namesToSearch = new Set<string>();
            if (mainUser.username) namesToSearch.add(mainUser.username);
            if (mainUser.minecraftNickname) namesToSearch.add(mainUser.minecraftNickname);

            relatedList.forEach(rel => {
                if (rel.username) namesToSearch.add(rel.username);
                if (rel.minecraftNickname) namesToSearch.add(rel.minecraftNickname);
            });

            let mergedSnapshots: AnticheatSnapshot[] = [];
            for (const name of Array.from(namesToSearch)) {
                try {
                    const res = await anticheatApi.getPlayerSnapshots(name, 0, 20);
                    if (res && res.content) {
                        for (const snap of res.content) {
                            if (!mergedSnapshots.some(s => s.id === snap.id)) {
                                mergedSnapshots.push(snap);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Failed to fetch anticheat snapshots for name ${name}:`, err);
                }
            }

            mergedSnapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSnapshots(mergedSnapshots);
        } catch (err) {
            console.error('Failed to fetch anticheat snapshots in dossier:', err);
        } finally {
            setSnapshotsLoading(false);
        }
    };

    // ========== Action handlers ==========

    const refreshAll = () => {
        if (activeUserId) loadUserProfile(activeUserId);
        onUserUpdated?.();
    };

    const handleRevokeWarning = async (warningId: number) => {
        try {
            await adminApi.revokeWarning(warningId);
            if (activeUserId) fetchWarnings(activeUserId);
            onUserUpdated?.();
        } catch (err) {
            console.error('Failed to revoke warning:', err);
            message.error('Не удалось отозвать предупреждение');
        }
    };

    const handleEditUser = async (values: any) => {
        if (!user) return;
        try {
            const { badges: selectedBadgeIds, ...updateData } = values;
            await adminApi.updateUser(user.id, updateData);

            const currentBadgeIds = user.badges ? user.badges.map(b => b.id) : [];
            const badgesToAdd = (selectedBadgeIds || []).filter((id: number) => !currentBadgeIds.includes(id));
            const badgesToRemove = currentBadgeIds.filter((id: number) => !(selectedBadgeIds || []).includes(id));

            for (const badgeId of badgesToAdd) {
                await adminApi.assignBadge(user.id, badgeId);
            }
            for (const badgeId of badgesToRemove) {
                await adminApi.removeBadge(user.id, badgeId);
            }

            message.success('Данные пользователя и значки обновлены');
            setIsEditVisible(false);
            refreshAll();
        } catch (err: any) {
            console.error('Failed to update user:', err);
            message.error(err.response?.data?.message || 'Не удалось обновить пользователя');
        }
    };

    const handleBanUser = async (values: any) => {
        if (!user) return;
        try {
            await adminApi.banUser(user.id, values.reason, values.silent, values.durationDays);
            message.success(`Пользователь ${user.username} забанен`);
            setIsBanVisible(false);
            banForm.resetFields();
            refreshAll();
        } catch (err) {
            console.error('Failed to ban user:', err);
            message.error('Не удалось забанить пользователя');
        }
    };

    const handleUnbanUser = () => {
        if (!user) return;
        Modal.confirm({
            title: `Разбанить игрока ${user.username}?`,
            content: 'Пользователь снова сможет входить на сайт и играть на сервере.',
            okText: 'Разбанить',
            cancelText: 'Отмена',
            className: 'custom-modal',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await adminApi.unbanUser(user.id);
                    message.success(`Пользователь ${user.username} разбанен`);
                    refreshAll();
                } catch (err) {
                    console.error('Failed to unban user:', err);
                    message.error('Не удалось разбанить пользователя');
                }
            }
        });
    };

    const handleIssueWarning = async (values: any) => {
        if (!user) return;
        try {
            await adminApi.issueWarning(user.id, values.reason, values.durationDays);
            message.success(`Предупреждение выдано игроку ${user.username}`);
            setIsWarnVisible(false);
            warnForm.resetFields();
            if (activeUserId) fetchWarnings(activeUserId);
            onUserUpdated?.();
        } catch (err) {
            console.error('Failed to issue warning:', err);
            message.error('Не удалось выдать предупреждение');
        }
    };

    const handleResetPassword = () => {
        if (!user) return;
        Modal.confirm({
            title: `Сбросить пароль для ${user.username}?`,
            content: 'Временный пароль будет сгенерирован и отправлен на почту пользователя.',
            okText: 'Сбросить',
            cancelText: 'Отмена',
            className: 'custom-modal',
            onOk: async () => {
                try {
                    await adminApi.resetUserPassword(user.id);
                    message.success('Пароль сброшен и выслан пользователю');
                } catch (err) {
                    console.error('Failed to reset password:', err);
                    message.error('Не удалось сбросить пароль');
                }
            }
        });
    };

    const handleResetMinecraftPassword = () => {
        if (!user) return;
        Modal.confirm({
            title: `Сбросить пароль Minecraft для ${user.username}?`,
            content: 'Это сбросит пароль авторизации на самом сервере Minecraft.',
            okText: 'Сбросить',
            cancelText: 'Отмена',
            className: 'custom-modal',
            onOk: async () => {
                try {
                    await adminApi.resetUserMinecraftPassword(user.id);
                    message.success('Minecraft-пароль успешно сброшен');
                } catch (err) {
                    console.error('Failed to reset Minecraft password:', err);
                    message.error('Не удалось сбросить Minecraft-пароль');
                }
            }
        });
    };

    const handleDeleteUser = () => {
        if (!user) return;
        Modal.confirm({
            title: `Удалить аккаунт ${user.username}?`,
            content: 'ВНИМАНИЕ: Это действие необратимо. Все заявки, логи и значки пользователя будут удалены.',
            okText: 'Удалить навсегда',
            cancelText: 'Отмена',
            className: 'custom-modal',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await adminApi.deleteUser(user.id);
                    message.success(`Пользователь ${user.username} удален`);
                    onClose();
                    onUserUpdated?.();
                } catch (err) {
                    console.error('Failed to delete user:', err);
                    message.error('Не удалось удалить пользователя');
                }
            }
        });
    };

    const handleTogglePlayer = async (checked: boolean) => {
        if (!user) return;
        if (!checked) {
            let isSilentChoice = false;
            Modal.confirm({
                title: `Снять статус игрока для ${user.username}?`,
                className: 'custom-modal',
                content: (
                    <div className="pt-2">
                        <p className="text-gray-300 text-sm mb-3">Выберите режим отзыва статуса:</p>
                        <Checkbox
                            onChange={(e) => { isSilentChoice = e.target.checked; }}
                            className="text-gray-200 font-medium"
                        >
                            Тихо (без уведомления в Discord)
                        </Checkbox>
                    </div>
                ),
                okText: 'Снять статус',
                cancelText: 'Отмена',
                okButtonProps: { danger: true },
                onOk: async () => {
                    setIsPlayerToggling(true);
                    try {
                        await adminApi.updateUser(user.id, { isPlayer: false, silent: isSilentChoice });
                        message.success(isSilentChoice ? 'Статус игрока тихо снят' : 'Статус игрока снят с уведомлением');
                        refreshAll();
                    } catch (err: any) {
                        console.error('Failed to toggle isPlayer:', err);
                        message.error(err.response?.data?.message || 'Не удалось изменить статус');
                    } finally {
                        setIsPlayerToggling(false);
                    }
                }
            });
            return;
        }
        setIsPlayerToggling(true);
        try {
            await adminApi.updateUser(user.id, { isPlayer: true });
            message.success('Статус игрока выдан');
            refreshAll();
        } catch (err: any) {
            console.error('Failed to toggle isPlayer:', err);
            message.error(err.response?.data?.message || 'Не удалось изменить статус');
        } finally {
            setIsPlayerToggling(false);
        }
    };

    const handleOpenAppModal = async (app: Application) => {
        setSelectedApp(app);
        appCommentForm.setFieldsValue({ comment: app.adminComment || '' });
        setIsAppViewVisible(true);
        setAppViewLoading(true);
        try {
            const fullData = await applicationsApi.getById(app.id);
            setSelectedApp(fullData);
            appCommentForm.setFieldsValue({ comment: fullData.adminComment || '' });
        } catch (err) {
            console.error('Failed to load application details in dossier:', err);
        } finally {
            setAppViewLoading(false);
        }
    };

    const handleUpdateAppStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!selectedApp) return;
        try {
            const comment = appCommentForm.getFieldValue('comment');
            await applicationsApi.updateStatus(selectedApp.id, status, comment);
            message.success(`Заявка #${selectedApp.id} ${status === 'ACCEPTED' ? 'одобрена' : 'отклонена'}`);
            setIsAppViewVisible(false);
            refreshAll();
        } catch (err: any) {
            console.error('Failed to update application status:', err);
            message.error(err.response?.data?.message || 'Не удалось обновить статус заявки');
        }
    };

    const openEditModal = () => {
        if (!user) return;
        const currentBadgeIds = user.badges ? user.badges.map(b => b.id) : [];
        editForm.setFieldsValue({
            email: user.email,
            role: user.role,
            minecraftNickname: user.minecraftNickname,
            discordNickname: user.discordNickname,
            bio: user.bio,
            isPlayer: user.isPlayer,
            badges: currentBadgeIds
        });
        setIsEditVisible(true);
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    // Columns config for warnings table
    const warningColumns = [
        {
            title: 'Причина',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => <Text style={{ color: '#fff' }} className="font-semibold">{text}</Text>
        },
        {
            title: 'Выдал',
            dataIndex: 'issuedByUsername',
            key: 'issuedByUsername',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Выдан',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <Text className="text-gray-400 text-xs">{new Date(date).toLocaleString('ru-RU')}</Text>
        },
        {
            title: 'Срок действия',
            key: 'expiresAt',
            render: (_: any, record: WarningResponse) => record.expiresAt ? (
                <Text className="text-amber-400 text-xs font-medium">До {new Date(record.expiresAt).toLocaleString('ru-RU')}</Text>
            ) : (
                <Text className="text-gray-500 text-xs">Навсегда</Text>
            )
        },
        {
            title: 'Статус',
            dataIndex: 'active',
            key: 'active',
            render: (active: boolean) => active ? (
                <Tag color="red">Активно</Tag>
            ) : (
                <Tag color="gray">Неактивно</Tag>
            )
        },
        {
            title: 'Действие',
            key: 'action',
            render: (_: any, record: WarningResponse) => record.active && (
                <Button 
                    type="link" 
                    danger 
                    size="small"
                    onClick={() => handleRevokeWarning(record.id)}
                >
                    Отозвать
                </Button>
            )
        }
    ];

    // Columns config for apps table
    const appColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <Text className="text-gray-400">#{id}</Text>
        },
        {
            title: 'Имя',
            key: 'name',
            render: (_: any, record: Application) => `${record.firstName}`
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                if (status === 'ACCEPTED') return <Tag color="success">Одобрена</Tag>;
                if (status === 'REJECTED') return <Tag color="error">Отклонена</Tag>;
                return <Tag color="warning">В ожидании</Tag>;
            }
        },
        {
            title: 'Дата',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <Text className="text-gray-400 text-xs">{new Date(date).toLocaleDateString('ru-RU')}</Text>
        },
        {
            title: 'Комментарий админа',
            dataIndex: 'adminComment',
            key: 'adminComment',
            render: (text: string) => <Text className="text-gray-400 text-xs italic">{text || '—'}</Text>
        }
    ];

    // Password reset dropdown items
    const passwordMenuItems = [
        {
            key: 'reset-site',
            icon: <KeyOutlined />,
            label: 'Сбросить пароль сайта',
            onClick: handleResetPassword
        },
        {
            key: 'reset-mc',
            icon: <KeyOutlined />,
            label: 'Сбросить пароль Minecraft',
            onClick: handleResetMinecraftPassword
        }
    ];

    const filteredMods = (selectedSnapshot?.mods?.filter(mod => 
        mod.name.toLowerCase().includes(innerModSearch.toLowerCase())
    ) || []).sort((a, b) => {
        const wA = a.status === 'SUSPICIOUS' ? 1 : a.status === 'UNKNOWN' ? 2 : 3;
        const wB = b.status === 'SUSPICIOUS' ? 1 : b.status === 'UNKNOWN' ? 2 : 3;
        if (wA !== wB) return wA - wB;
        return a.name.localeCompare(b.name);
    });

    const filteredProcesses = selectedSnapshot?.processes?.filter(proc => 
        proc.imageName.toLowerCase().includes(processSearch.toLowerCase()) ||
        (proc.windowTitle && proc.windowTitle.toLowerCase().includes(processSearch.toLowerCase()))
    ) || [];

    return (
        <>
        <Drawer
            title={
                <div className="flex items-center gap-3">
                    <SafetyOutlined style={{ color: '#00BFFF' }} />
                    <span className="font-minecraft text-white">Досье игрока</span>
                </div>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={720}
            className="text-white border-l border-white/5"
            styles={{
                header: { background: '#14213d', borderBottom: '1px solid rgba(255,255,255,0.05)' },
                body: { background: '#0b1320', padding: 0 }
            }}
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                    <Spin size="large" />
                </div>
            ) : error ? (
                <div className="p-6">
                    <Alert message="Ошибка" description={error} type="error" showIcon />
                </div>
            ) : user ? (
                <div className="flex flex-col h-full bg-[#0b1320]">
                    {/* Problem Notifications Banner */}
                    {(() => {
                        const alerts: React.ReactNode[] = [];
                        if (relatedAccounts.length > 0) {
                            const bannedRelated = relatedAccounts.filter(a => a.banned);
                            alerts.push(
                                <Alert
                                    key="multi"
                                    type={bannedRelated.length > 0 ? 'error' : 'warning'}
                                    showIcon
                                    banner
                                    message={
                                        <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('general')}>
                                            Обнаружены совпадения по IP — {relatedAccounts.length} акк.{bannedRelated.length > 0 ? ` (${bannedRelated.length} забанен!)` : ''}
                                        </span>
                                    }
                                />
                            );
                        }
                        const suspiciousMods = snapshots.some(s => s.mods?.some(m => m.status === 'SUSPICIOUS'));
                        if (suspiciousMods) {
                            alerts.push(
                                <Alert
                                    key="mods"
                                    type="error"
                                    showIcon
                                    banner
                                    message={
                                        <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('anticheat')}>
                                            Подозрительные моды в античите! Нажмите для перехода.
                                        </span>
                                    }
                                />
                            );
                        }
                        if (warnings.filter(w => w.active).length >= 3) {
                            alerts.push(
                                <Alert
                                    key="warns"
                                    type="error"
                                    showIcon
                                    banner
                                    message={
                                        <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('warnings')}>
                                            Критичное кол-во варнов: {warnings.filter(w => w.active).length}
                                        </span>
                                    }
                                />
                            );
                        }
                        if (alerts.length === 0) return null;
                        return <div className="flex flex-col">{alerts}</div>;
                    })()}

                    {/* Dossier Header Info */}
                    <div className="p-6 bg-[#14213d] border-b border-white/5 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <Space size={16} align="center">
                                <Badge dot status={user.banned ? "error" : "success"} offset={[-4, 32]}>
                                    <Avatar
                                        src={user.avatarUrl}
                                        size={48}
                                        style={{ border: '2px solid rgba(0,191,255,0.3)', backgroundColor: '#0086B3' }}
                                    >
                                        {user.username?.substring(0, 1).toUpperCase()}
                                    </Avatar>
                                </Badge>
                                <div>
                                    <Title level={4} style={{ color: '#fff', margin: 0 }}>
                                        {user.username}
                                    </Title>
                                    <Space className="text-gray-400 text-xs mt-1">
                                        <Text className="text-gray-400">ID: #{user.id}</Text>
                                        <Text className="text-gray-500">•</Text>
                                         {user.banned ? (
                                             <Tooltip title={`Причина бана: ${user.banReason || 'Причина не указана'}`}>
                                                 <Tag color="red" icon={<StopOutlined />} className="text-[10px] font-bold cursor-help">ЗАБАНЕН</Tag>
                                             </Tooltip>
                                         ) : user.isPlayer ? (
                                             <Tag color="success" icon={<CheckCircleOutlined />} className="text-[10px] font-bold">ИГРОК</Tag>
                                         ) : (
                                             <Tag color="warning" className="text-[10px] font-bold">РЕГИСТРАЦИЯ</Tag>
                                         )}
                                    </Space>
                                </div>
                            </Space>
                            <Space direction="vertical" align="end" size={2}>
                                <Tag color={user.role === 'ROLE_ADMIN' ? 'red' : user.role === 'ROLE_MODERATOR' ? 'purple' : 'blue'}>
                                    {user.role.replace('ROLE_', '')}
                                </Tag>
                            </Space>
                        </div>

                        {/* isPlayer toggle */}
                        <div className="flex items-center gap-3 px-1">
                            <UserSwitchOutlined style={{ color: '#00BFFF', fontSize: 16 }} />
                            <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Статус игрока</Text>
                            <Switch
                                checked={!!user.isPlayer}
                                onChange={handleTogglePlayer}
                                loading={isPlayerToggling}
                                size="small"
                                className="ml-1"
                            />
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={openEditModal}
                                style={{ borderColor: 'rgba(0,191,255,0.3)', color: '#00BFFF', background: 'rgba(0,191,255,0.08)' }}
                            >
                                Редактировать
                            </Button>
                            <Button
                                size="small"
                                icon={<MessageOutlined />}
                                onClick={() => {
                                    if (onSendMessage) {
                                        onSendMessage(user.id);
                                    } else {
                                        window.location.href = `/admin/messenger?userId=${user.id}`;
                                    }
                                    onClose();
                                }}
                                style={{ borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8', background: 'rgba(99,102,241,0.12)' }}
                            >
                                Сообщение
                            </Button>
                            <Button
                                size="small"
                                icon={<WarningOutlined />}
                                onClick={() => setIsWarnVisible(true)}
                                style={{ borderColor: 'rgba(250,173,20,0.3)', color: '#faad14', background: 'rgba(250,173,20,0.08)' }}
                            >
                                Варн
                            </Button>
                            {user.banned ? (
                                <Button
                                    size="small"
                                    icon={<UnlockOutlined />}
                                    onClick={handleUnbanUser}
                                    style={{ borderColor: 'rgba(82,196,26,0.3)', color: '#52c41a', background: 'rgba(82,196,26,0.08)' }}
                                >
                                    Разбанить
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    icon={<StopOutlined />}
                                    onClick={() => setIsBanVisible(true)}
                                    danger
                                >
                                    Забанить
                                </Button>
                            )}
                            <Dropdown menu={{ items: passwordMenuItems }} trigger={['click']}>
                                <Button
                                    size="small"
                                    icon={<KeyOutlined />}
                                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#a0aec0', background: 'rgba(255,255,255,0.04)' }}
                                >
                                    Пароли <DownOutlined style={{ fontSize: 10 }} />
                                </Button>
                            </Dropdown>
                            <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteUser}
                                danger
                                type="text"
                                style={{ color: '#ff4d4f' }}
                            >
                                Удалить
                            </Button>
                        </div>
                    </div>

                    {/* Dossier Tabs */}
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        className="flex-1 text-white"
                        style={{ paddingBottom: 24, paddingTop: 8, paddingLeft: 24, paddingRight: 24 }}
                        items={[
                            {
                                key: 'general',
                                label: <span className="font-semibold text-xs uppercase tracking-wide">Главное & IP</span>,
                                children: (
                                    <div className="space-y-6 pt-4">
                                        {user.banned && (
                                            <Alert
                                                message={<span className="font-bold">Игрок заблокирован</span>}
                                                description={
                                                    <div className="mt-1 text-xs">
                                                        <span className="opacity-75">Причина бана:</span> <span className="font-semibold text-white">{user.banReason || 'Причина не указана'}</span>
                                                    </div>
                                                }
                                                type="error"
                                                showIcon
                                                icon={<StopOutlined />}
                                                className="border-red-500/20 bg-red-950/20 text-red-200 rounded-xl"
                                            />
                                        )}
                                        <Descriptions bordered column={1} size="small" className="border-white/5 rounded-xl overflow-hidden bg-black/10">
                                            <Descriptions.Item label="Minecraft ник">
                                                <Space>
                                                    <Text style={{ color: '#fff' }} className="font-bold">{user.minecraftNickname || '—'}</Text>
                                                    {user.minecraftNickname && (
                                                        <Tooltip title="Скопировать ник">
                                                            <Button type="text" size="small" icon={<CopyOutlined className="text-gray-500" />} onClick={() => copyToClipboard(user.minecraftNickname)} />
                                                        </Tooltip>
                                                    )}
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Discord ник">
                                                <Space size={6} align="center">
                                                    <Text style={{ color: '#fff' }}>{user.discordNickname || '—'}</Text>
                                                    {user.discordNickname && (
                                                        <>
                                                            <Tooltip title={user.inDiscordServer ? "На Discord сервере" : "Не на Discord сервере"}>
                                                                <span 
                                                                    className={`text-[12px] leading-none shrink-0 ${user.inDiscordServer ? 'text-indigo-400' : 'text-gray-600 grayscale opacity-40'}`}
                                                                    style={{ cursor: 'default' }}
                                                                >
                                                                    🌐
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title={user.discordVerified ? "Discord аккаунт подтвержден" : "Discord аккаунт не подтвержден"}>
                                                                {user.discordVerified ? (
                                                                    <SafetyOutlined style={{ color: '#52c41a', fontSize: '13px' }} />
                                                                ) : (
                                                                    <SafetyOutlined style={{ color: '#595959', opacity: 0.4, fontSize: '13px' }} />
                                                                )}
                                                            </Tooltip>
                                                            <Tooltip title="Скопировать Discord">
                                                                <Button type="text" size="small" icon={<CopyOutlined className="text-gray-500" />} onClick={() => copyToClipboard(user.discordNickname)} />
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Email">{user.email || '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Дата регистрации">
                                                <span className="text-gray-300">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleString('ru-RU') : '—'}
                                                </span>
                                            </Descriptions.Item>
                                        </Descriptions>

                                        {/* ── Блок 1: Регистрация ── */}
                                        <Divider titlePlacement="left" style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '24px 0 12px 0' }}>
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                                🔹 При регистрации
                                            </span>
                                        </Divider>
                                        <Descriptions bordered size="small" column={1} className="bg-black/10 rounded-xl overflow-hidden border-white/5">
                                            <Descriptions.Item label="IP">
                                                <IPGeoInfo ip={user.registrationIp} colorClasses="text-blue-400" />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Время">
                                                <span className="text-gray-300 text-xs font-mono">{user.createdAt ? new Date(user.createdAt).toLocaleString('ru-RU') : '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="User-Agent">
                                                <span className="text-gray-400 text-[10px] break-all">{user.registrationUserAgent || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Canvas">
                                                <span className="text-[#00BFFF] text-xs font-mono font-bold">{user.registrationCanvas || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="WebGL">
                                                <span className="text-gray-300 text-xs font-mono break-all">{user.registrationWebgl || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Разрешение / CPU / RAM">
                                                <span className="text-gray-300 text-xs">
                                                    {user.registrationResolution || '—'} / {user.registrationHardware ? `${user.registrationHardware} ядер` : '—'} / {user.registrationMemory || '—'}
                                                </span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Таймзона / Язык">
                                                <span className="text-gray-300 text-xs font-mono">{user.registrationTimezone || '—'} / {user.registrationLanguage || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Масштаб / Тачскрин">
                                                <span className="text-gray-300 text-xs">
                                                    {user.registrationPixelRatio || '—'} / {(() => { const tp = user.registrationTouchPoints; if (!tp) return '—'; return Number(tp) > 0 ? `Да (${tp})` : 'Нет'; })()}
                                                </span>
                                            </Descriptions.Item>
                                        </Descriptions>

                                        {/* ── Блок 2: Текущая сессия ── */}
                                        <Divider titlePlacement="left" style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '24px 0 12px 0' }}>
                                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                                                🟢 Текущая сессия
                                            </span>
                                        </Divider>
                                        <Descriptions bordered size="small" column={1} className="bg-black/10 rounded-xl overflow-hidden border-white/5">
                                            <Descriptions.Item label="IP">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <IPGeoInfo ip={user.lastLoginIp1} colorClasses="text-green-500" />
                                                </div>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Время входа">
                                                <span className="text-gray-300 text-xs font-mono">{user.lastLoginTime1 ? new Date(user.lastLoginTime1).toLocaleString('ru-RU') : '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="User-Agent">
                                                <span className="text-gray-400 text-[10px] break-all">{user.lastLoginUserAgent1 || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Canvas">
                                                <span className="text-[#00BFFF] text-xs font-mono font-bold">{user.lastLoginCanvas1 || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="WebGL">
                                                <span className="text-gray-300 text-xs font-mono break-all">{user.lastLoginWebgl1 || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Разрешение / CPU / RAM">
                                                <span className="text-gray-300 text-xs">
                                                    {user.lastLoginResolution1 || '—'} / {user.lastLoginHardware1 ? `${user.lastLoginHardware1} ядер` : '—'} / {user.lastLoginMemory1 || '—'}
                                                </span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Таймзона / Язык">
                                                <span className="text-gray-300 text-xs font-mono">{user.lastLoginTimezone1 || '—'} / {user.lastLoginLanguage1 || '—'}</span>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Масштаб / Тачскрин">
                                                <span className="text-gray-300 text-xs">
                                                    {user.lastLoginPixelRatio1 || '—'} / {(() => { const tp = user.lastLoginTouchPoints1; if (!tp) return '—'; return Number(tp) > 0 ? `Да (${tp})` : 'Нет'; })()}
                                                </span>
                                            </Descriptions.Item>
                                        </Descriptions>

                                        {/* ── Блок 3: Прошлая сессия ── */}
                                        {(user.lastLoginIp2 || user.lastLoginCanvas2) && (
                                            <>
                                                <Divider titlePlacement="left" style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '24px 0 12px 0' }}>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        ⚪ Прошлая сессия
                                                    </span>
                                                </Divider>
                                                <Descriptions bordered size="small" column={1} className="bg-black/10 rounded-xl overflow-hidden border-white/5">
                                                    <Descriptions.Item label="IP">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <IPGeoInfo ip={user.lastLoginIp2} colorClasses="text-gray-400" />
                                                        </div>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Время входа">
                                                        <span className="text-gray-300 text-xs font-mono">{user.lastLoginTime2 ? new Date(user.lastLoginTime2).toLocaleString('ru-RU') : '—'}</span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="User-Agent">
                                                        <span className="text-gray-400 text-[10px] break-all">{user.lastLoginUserAgent2 || '—'}</span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Canvas">
                                                        <span className="text-[#00BFFF] text-xs font-mono font-bold">{user.lastLoginCanvas2 || '—'}</span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="WebGL">
                                                        <span className="text-gray-300 text-xs font-mono break-all">{user.lastLoginWebgl2 || '—'}</span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Разрешение / CPU / RAM">
                                                        <span className="text-gray-300 text-xs">
                                                            {user.lastLoginResolution2 || '—'} / {user.lastLoginHardware2 ? `${user.lastLoginHardware2} ядер` : '—'} / {user.lastLoginMemory2 || '—'}
                                                        </span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Таймзона / Язык">
                                                        <span className="text-gray-300 text-xs font-mono">{user.lastLoginTimezone2 || '—'} / {user.lastLoginLanguage2 || '—'}</span>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Масштаб / Тачскрин">
                                                        <span className="text-gray-300 text-xs">
                                                            {user.lastLoginPixelRatio2 || '—'} / {(() => { const tp = user.lastLoginTouchPoints2; if (!tp) return '—'; return Number(tp) > 0 ? `Да (${tp})` : 'Нет'; })()}
                                                        </span>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </>
                                        )}

                                        {/* Related Accounts Section — only shown if detected */}
                                        {relatedLoading ? (
                                            <div className="py-4 text-center"><Spin size="small" /></div>
                                        ) : relatedAccounts.length > 0 && (
                                            <>
                                                <Divider titlePlacement="left" style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '24px 0 12px 0' }}>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                        Связанные аккаунты ({relatedAccounts.length})
                                                    </span>
                                                </Divider>
                                                <List
                                                    className="border-white/5 bg-black/10 rounded-xl overflow-hidden mt-3"
                                                    dataSource={relatedAccounts}
                                                    renderItem={item => (
                                                        <List.Item 
                                                            className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer block"
                                                            onClick={() => setActiveUserId(item.id)}
                                                        >
                                                            <div className="flex flex-col gap-1 w-full">
                                                                <div className="flex items-center justify-between w-full">
                                                                    <Space>
                                                                        <Avatar src={item.avatarUrl} size="small">{item.username.substring(0, 1).toUpperCase()}</Avatar>
                                                                        <Text style={{ color: '#fff' }} className="font-bold">{item.username}</Text>
                                                                        {item.minecraftNickname && (
                                                                            <Text className="text-gray-500 text-xs">({item.minecraftNickname})</Text>
                                                                        )}
                                                                    </Space>
                                                                    <Space size={4}>
                                                                         {(() => {
                                                                             const isSameCanvas = (item.registrationCanvas && item.registrationCanvas !== 'unknown' && (item.registrationCanvas === user.registrationCanvas || item.registrationCanvas === user.lastLoginCanvas1 || item.registrationCanvas === user.lastLoginCanvas2)) ||
                                                                                                  (item.lastLoginCanvas1 && item.lastLoginCanvas1 !== 'unknown' && (item.lastLoginCanvas1 === user.registrationCanvas || item.lastLoginCanvas1 === user.lastLoginCanvas1 || item.lastLoginCanvas1 === user.lastLoginCanvas2));
                                                                             return isSameCanvas ? (
                                                                                 <Tag color="warning" className="text-[9px] uppercase font-bold m-0 px-1 py-0.5 border-amber-500/20 bg-amber-950/20 text-amber-300">Совпадение по отпечатку</Tag>
                                                                             ) : null;
                                                                         })()}
                                                                         {item.banned ? (
                                                                              <Tag color="red" icon={<StopOutlined />} className="text-[10px] font-bold m-0">ЗАБАНЕН</Tag>
                                                                         ) : (
                                                                              <Tag color="success" className="text-[10px] m-0">Чист</Tag>
                                                                         )}
                                                                    </Space>
                                                                </div>
                                                                {/* User Agents */}
                                                                <div className="pl-7 text-[10px] text-gray-500 flex flex-col gap-0.5 mt-0.5">
                                                                    {item.lastLoginUserAgent1 && (
                                                                        <div className="break-all"><span className="text-gray-600 font-semibold font-mono">Session UA:</span> {item.lastLoginUserAgent1}</div>
                                                                    )}
                                                                    {item.registrationUserAgent && item.registrationUserAgent !== item.lastLoginUserAgent1 && (
                                                                        <div className="break-all"><span className="text-gray-600 font-semibold font-mono">Reg UA:</span> {item.registrationUserAgent}</div>
                                                                    )}
                                                                    {!item.lastLoginUserAgent1 && !item.registrationUserAgent && (
                                                                        <div className="text-gray-600 italic">Нет данных о User-Agent</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            </>    
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'applications',
                                label: <span className="font-semibold text-xs uppercase tracking-wide">Заявки</span>,
                                children: (
                                    <div className="pt-4">
                                        <Table
                                            dataSource={applications}
                                            columns={appColumns}
                                            rowKey="id"
                                            loading={appsLoading}
                                            pagination={{ pageSize: 5 }}
                                            className="custom-table"
                                            onRow={(record) => ({
                                                onClick: () => handleOpenAppModal(record),
                                                style: { cursor: 'pointer' }
                                            })}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'warnings',
                                label: <span className="font-semibold text-xs uppercase tracking-wide">Варны ({warnings.filter(w => w.active).length})</span>,
                                children: (
                                    <div className="pt-4">
                                        <Table
                                            dataSource={warnings}
                                            columns={warningColumns}
                                            rowKey="id"
                                            loading={warningsLoading}
                                            pagination={{ pageSize: 5 }}
                                            className="custom-table"
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'logs',
                                label: <span className="font-semibold text-xs uppercase tracking-wide">Аудит-логи</span>,
                                children: (
                                    <div className="pt-4 space-y-4">
                                        {logsLoading ? (
                                            <div className="py-12 text-center"><Spin tip="Загрузка логов..." /></div>
                                        ) : auditLogs.length === 0 ? (
                                            <Alert message="Действий не зафиксировано" type="info" className="border-white/5 bg-black/20" />
                                        ) : (
                                            <div 
                                                className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[450px] overflow-y-auto custom-scrollbar"
                                                onScroll={(e) => {
                                                    const target = e.currentTarget;
                                                    if (target.scrollHeight - target.scrollTop - target.clientHeight < 40) {
                                                        loadMoreAuditLogs();
                                                    }
                                                }}
                                            >
                                                <List
                                                    dataSource={auditLogs}
                                                    renderItem={log => (
                                                        <List.Item className="px-4 py-3 border-b border-white/5 flex flex-col items-start gap-1 hover:bg-white/5 transition-colors">
                                                            <div className="flex justify-between w-full text-xs">
                                                                <Space>
                                                                    <Tag color="cyan">{log.actionType}</Tag>
                                                                    <Text className="text-gray-400">Инициатор: <Text style={{ color: '#fff' }} className="font-semibold">{log.actorUsername}</Text></Text>
                                                                    {log.targetUsername && (
                                                                        <Text className="text-gray-400"> • Цель: <Text style={{ color: '#fff' }} className="font-semibold">{log.targetUsername}</Text></Text>
                                                                    )}
                                                                </Space>
                                                                <Text className="text-gray-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString('ru-RU')}</Text>
                                                            </div>
                                                            <Text className="text-gray-300 text-xs mt-1 leading-relaxed pl-1">{log.details}</Text>
                                                        </List.Item>
                                                    )}
                                                />
                                                {auditLogsLoadingMore && (
                                                    <div className="py-3 text-center border-t border-white/5"><Spin size="small" tip="Загрузка архивных логов..." /></div>
                                                )}
                                                {!auditLogsHasMore && auditLogs.length > 0 && (
                                                    <div className="py-2 text-center text-[11px] text-gray-500 border-t border-white/5">Все связанные логи загружены</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'anticheat',
                                label: <span className="font-semibold text-xs uppercase tracking-wide">Античит ({snapshots.length})</span>,
                                children: (
                                    <div className="pt-4 space-y-4">
                                        {snapshotsLoading ? (
                                            <div className="py-12 text-center"><Spin /></div>
                                        ) : snapshots.length === 0 ? (
                                            <Alert message="Античит снапшоты отсутствуют" type="info" className="border-white/5 bg-black/20" />
                                        ) : (
                                            <List
                                                className="border-white/5 bg-black/10 rounded-xl overflow-hidden"
                                                dataSource={snapshots}
                                                renderItem={s => (
                                                    <List.Item 
                                                        className="px-4 py-3 border-b border-white/5 flex items-center justify-between hover:bg-[#00BFFF]/5 cursor-pointer transition-colors"
                                                        onClick={() => handleOpenSnapModal(s)}
                                                    >
                                                        <Space direction="vertical" size={1} align="start">
                                                            <Space>
                                                                <Text style={{ color: '#fff' }} className="font-semibold">{s.launcherName || 'Launcher'}</Text>
                                                                <Text className="text-gray-500 text-xs">({s.launcherBrand || 'vanilla'})</Text>
                                                            </Space>
                                                            <Text className="text-gray-500 text-[10px]">{new Date(s.createdAt).toLocaleString('ru-RU')}</Text>
                                                        </Space>
                                                        <Space>
                                                            <Tag color={s.mods?.some(m => m.status === 'SUSPICIOUS') ? 'red' : 'success'}>
                                                                Модов: {s.mods?.length || 0}
                                                            </Tag>
                                                            <Button 
                                                                type="link" 
                                                                size="small" 
                                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(s.id.toString()); }}
                                                            >
                                                                ID: {s.id}
                                                            </Button>
                                                        </Space>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            ) : null}
        </Drawer>

        {/* Modal: Edit User */}
        <Modal
            title={<span className="text-white font-bold font-minecraft">Редактировать данные: {user?.username}</span>}
            open={isEditVisible}
            onCancel={() => setIsEditVisible(false)}
            footer={null}
            className="custom-modal"
        >
            <Form form={editForm} layout="vertical" onFinish={handleEditUser} className="pt-4">
                <Form.Item name="email" label="Email почта" rules={[{ required: true, type: 'email', message: 'Введите корректный email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="minecraftNickname" label="Minecraft ник">
                    <Input />
                </Form.Item>
                <Form.Item name="discordNickname" label="Discord ник">
                    <Input />
                </Form.Item>
                <Form.Item name="bio" label="О себе (Описание)">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="role" label="Роль" rules={[{ required: true }]}>
                    <Select>
                        <Select.Option value="ROLE_USER">USER</Select.Option>
                        <Select.Option value="ROLE_MODERATOR">MODERATOR</Select.Option>
                        <Select.Option value="ROLE_ADMIN">ADMIN</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="isPlayer" valuePropName="checked" className="mb-2">
                    <Checkbox className="text-gray-300">Статус игрока (isPlayer)</Checkbox>
                </Form.Item>
                <Form.Item name="badges" label={<span className="text-gray-300">Значки (Badges)</span>} className="mb-4">
                    <Select mode="multiple" placeholder="Выберите значки" optionFilterProp="label" className="custom-select">
                        {availableBadges.map(badge => (
                            <Select.Option key={badge.id} value={badge.id} label={badge.name}>
                                <Space>
                                    {badge.svgIcon ? (
                                        <div 
                                            className="w-4 h-4 badge-icon flex items-center justify-center rounded-sm" 
                                            style={{ backgroundColor: badge.color + '20', display: 'inline-flex' }}
                                            dangerouslySetInnerHTML={{ __html: badge.svgIcon }}
                                        />
                                    ) : null}
                                    <span style={{ color: badge.color }}>{badge.name}</span>
                                </Space>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item className="mb-0 flex justify-end">
                    <Space>
                        <Button onClick={() => setIsEditVisible(false)}>Отмена</Button>
                        <Button type="primary" htmlType="submit" style={{ background: '#00BFFF', borderColor: '#00BFFF', color: '#000', fontWeight: 600 }}>Сохранить</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>

        {/* Modal: Ban User */}
        <Modal
            title={<span className="text-white font-bold font-minecraft">Забанить игрока: {user?.username}</span>}
            open={isBanVisible}
            onCancel={() => setIsBanVisible(false)}
            footer={null}
            className="custom-modal"
        >
            <Form form={banForm} layout="vertical" onFinish={handleBanUser} className="pt-4" initialValues={{ silent: false, durationDays: undefined }}>
                <Form.Item name="reason" label="Причина бана" rules={[{ required: true, message: 'Пожалуйста, укажите причину бана' }]}>
                    <Input.TextArea rows={3} placeholder="Нарушение правил сервера..." />
                </Form.Item>
                <Form.Item name="durationDays" label="Срок блокировки">
                    <Select placeholder="Навсегда (бессрочно)" allowClear className="custom-select">
                        <Select.Option value={undefined}>Навсегда (бессрочно)</Select.Option>
                        <Select.Option value={1}>1 день</Select.Option>
                        <Select.Option value={3}>3 дня</Select.Option>
                        <Select.Option value={7}>7 дней</Select.Option>
                        <Select.Option value={14}>14 дней</Select.Option>
                        <Select.Option value={30}>30 дней</Select.Option>
                        <Select.Option value={90}>90 дней</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="silent" valuePropName="checked" className="mb-4">
                    <Checkbox className="text-gray-300">Без уведомления в Discord</Checkbox>
                </Form.Item>
                <Form.Item className="mb-0 flex justify-end">
                    <Space>
                        <Button onClick={() => setIsBanVisible(false)}>Отмена</Button>
                        <Button type="primary" danger htmlType="submit">Заблокировать</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>

        {/* Modal: Issue Warning */}
        <Modal
            title={<span className="text-white font-bold font-minecraft">Выдать предупреждение (варн): {user?.username}</span>}
            open={isWarnVisible}
            onCancel={() => setIsWarnVisible(false)}
            footer={null}
            className="custom-modal"
        >
            <Form form={warnForm} layout="vertical" onFinish={handleIssueWarning} className="pt-4" initialValues={{ durationDays: undefined }}>
                <Form.Item name="reason" label="Причина варна" rules={[{ required: true, message: 'Пожалуйста, укажите причину предупреждения' }]}>
                    <Input.TextArea rows={3} placeholder="Недопустимое поведение, грифинг..." />
                </Form.Item>
                <Form.Item name="durationDays" label="Срок действия варна">
                    <Select placeholder="Навсегда (бессрочно)" allowClear className="custom-select">
                        <Select.Option value={undefined}>Навсегда (бессрочно)</Select.Option>
                        <Select.Option value={1}>1 день</Select.Option>
                        <Select.Option value={3}>3 дня</Select.Option>
                        <Select.Option value={7}>7 дней</Select.Option>
                        <Select.Option value={14}>14 дней</Select.Option>
                        <Select.Option value={30}>30 дней</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item className="mb-0 flex justify-end">
                    <Space>
                        <Button onClick={() => setIsWarnVisible(false)}>Отмена</Button>
                        <Button type="primary" danger htmlType="submit">Выдать предупреждение</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>

        {/* Modal: View Snapshot Detail */}
        <Modal
            title={
                <div className="flex items-center gap-3">
                    <SafetyOutlined style={{ color: '#00BFFF' }} />
                    <span className="text-white font-bold font-minecraft text-sm">Снапшот античита #{selectedSnapshot?.id} ({selectedSnapshot?.playerName})</span>
                </div>
            }
            open={isSnapModalVisible}
            onCancel={() => setIsSnapModalVisible(false)}
            footer={null}
            width={1150}
            className="custom-modal anticheat-detail-modal"
        >
            {snapDetailsLoading ? (
                <div className="py-20 text-center"><Spin tip="Загрузка деталей процессов..." /></div>
            ) : selectedSnapshot ? (
                <div className="space-y-6 pt-4 text-gray-200">
                    {selectedSnapshot.suspicious && (
                        <Alert
                            message={<span className="font-bold text-red-200">Обнаружена подозрительная активность</span>}
                            description={
                                <div className="space-y-2 mt-1 text-xs">
                                    <div>Коэффициент аномальности: <span className="font-bold text-red-400">{Math.round((selectedSnapshot.anomalyScore || 0) * 100)}%</span></div>
                                    <div>Детали аномалий: <span className="italic text-gray-300">{selectedSnapshot.anomalyDetails || '—'}</span></div>
                                </div>
                            }
                            type="error"
                            showIcon
                            className="border-red-500/20 bg-red-950/20 text-red-200 rounded-xl"
                        />
                    )}

                    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" className="border-white/5 rounded-xl overflow-hidden bg-black/10 text-gray-300">
                        <Descriptions.Item label="Игрок">{selectedSnapshot.playerName}</Descriptions.Item>
                        <Descriptions.Item label="Лаунчер">{selectedSnapshot.launcherName} ({selectedSnapshot.launcherBrand})</Descriptions.Item>
                        <Descriptions.Item label="Дата снапшота">{new Date(selectedSnapshot.createdAt).toLocaleString('ru-RU')}</Descriptions.Item>
                        <Descriptions.Item label="UUID">{selectedSnapshot.playerUuid || '—'}</Descriptions.Item>
                    </Descriptions>

                    <Tabs
                        defaultActiveKey="mods"
                        size="small"
                        items={[
                            {
                                key: 'mods',
                                label: <span className="text-xs font-bold uppercase tracking-wide">Моды ({selectedSnapshot.mods?.length || 0})</span>,
                                children: (
                                    <div className="space-y-4 pt-3">
                                        <Input
                                            placeholder="Фильтр модов по названию..."
                                            prefix={<SearchOutlined />}
                                            value={innerModSearch}
                                            onChange={e => setInnerModSearch(e.target.value)}
                                            className="bg-black/30 border-white/5 rounded-xl text-white"
                                        />
                                        <List
                                            bordered
                                            className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto"
                                            dataSource={filteredMods}
                                            renderItem={(mod: ModEntry) => (
                                                <List.Item className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                    <code className="text-gray-300 text-xs">{mod.name}</code>
                                                    <Space size={6} align="center">
                                                        {mod.status === 'TRUSTED' ? (
                                                            <Tag color="success" className="text-[9px]">ДОВЕРЕННЫЙ</Tag>
                                                        ) : mod.status === 'SUSPICIOUS' ? (
                                                            <Tag color="red" icon={<WarningOutlined />} className="text-[9px] font-bold">ПОДОЗРИТЕЛЬНЫЙ</Tag>
                                                        ) : (
                                                            <Tag color="warning" className="text-[9px]">НЕИЗВЕСТНЫЙ</Tag>
                                                        )}
                                                        {isAdmin && (
                                                            <Space size={2} className="ml-4 border-l border-white/10 pl-2">
                                                                {mod.status !== 'TRUSTED' && (
                                                                    <Tooltip title="Пометить как доверенный">
                                                                        <Button 
                                                                            size="small" 
                                                                            type="text" 
                                                                            style={{ padding: '0 4px', height: 20 }}
                                                                            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '11px' }} />} 
                                                                            onClick={() => handleUpdateModStatus(mod.name, 'TRUSTED')} 
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                                {mod.status !== 'SUSPICIOUS' && (
                                                                    <Tooltip title="Пометить как подозрительный">
                                                                        <Button 
                                                                            size="small" 
                                                                            type="text" 
                                                                            style={{ padding: '0 4px', height: 20 }}
                                                                            icon={<WarningOutlined style={{ color: '#ff4d4f', fontSize: '11px' }} />} 
                                                                            onClick={() => handleUpdateModStatus(mod.name, 'SUSPICIOUS')} 
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                                {mod.status !== 'UNKNOWN' && (
                                                                    <Tooltip title="Сбросить статус (сделать неизвестным)">
                                                                        <Button 
                                                                            size="small" 
                                                                            type="text" 
                                                                            style={{ padding: '0 4px', height: 20 }}
                                                                            icon={<DeleteOutlined style={{ color: '#8c8c8c', fontSize: '11px' }} />} 
                                                                            onClick={() => handleUpdateModStatus(mod.name, 'UNKNOWN')} 
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                            </Space>
                                                        )}
                                                    </Space>
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'processes',
                                label: <span className="text-xs font-bold uppercase tracking-wide">Процессы ({selectedSnapshot.processes?.length || 0})</span>,
                                children: (
                                    <div className="space-y-4 pt-3">
                                        <Input
                                            placeholder="Поиск процесса или заголовка окна..."
                                            prefix={<SearchOutlined />}
                                            value={processSearch}
                                            onChange={e => setProcessSearch(e.target.value)}
                                            className="bg-black/30 border-white/5 rounded-xl text-white"
                                        />
                                        <List
                                            bordered
                                            className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto"
                                            dataSource={filteredProcesses}
                                            renderItem={(proc: ProcessInfo) => (
                                                <List.Item className="px-4 py-2 border-b border-white/5 flex flex-col items-start gap-1">
                                                    <div className="flex justify-between w-full">
                                                        <Text style={{ color: '#fff' }} className="font-semibold text-xs font-mono">{proc.imageName}</Text>
                                                        <Space>
                                                            <Tag color="blue" className="text-[9px]">PID: {proc.pid}</Tag>
                                                            <Tag color="gray" className="text-[9px]">{proc.memUsage}</Tag>
                                                        </Space>
                                                    </div>
                                                    {proc.windowTitle && (
                                                        <Text className="text-gray-500 text-[10px] pl-1">
                                                            Окно: <span className="text-gray-400 italic font-sans">"{proc.windowTitle}"</span>
                                                        </Text>
                                                    )}
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'resourcepacks',
                                label: <span className="text-xs font-bold uppercase tracking-wide">Ресурспаки ({selectedSnapshot.resourcePacks?.length || 0})</span>,
                                children: (
                                    <div className="pt-3">
                                        <List
                                            bordered
                                            className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto"
                                            dataSource={selectedSnapshot.resourcePacks || []}
                                            renderItem={(pack: string) => (
                                                <List.Item className="px-4 py-2 border-b border-white/5">
                                                    <Text className="text-gray-300 text-xs">{pack}</Text>
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            ) : null}
        </Modal>

        {/* Modal: View & Moderate Application */}
        <Modal
            title={
                <div className="flex items-center gap-3">
                    <FileTextOutlined style={{ color: '#FFD700' }} />
                    <span className="text-white font-bold font-minecraft">Проверка заявки #{selectedApp?.id}</span>
                </div>
            }
            open={isAppViewVisible}
            onCancel={() => setIsAppViewVisible(false)}
            footer={null}
            width={850}
            className="custom-modal"
        >
            {selectedApp && (
                <Spin spinning={appViewLoading}>
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

                        {/* Verdict / Decision Section */}
                        <Form form={appCommentForm} layout="vertical" className="border-t border-white/5 pt-4">
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
                                    <Button onClick={() => setIsAppViewVisible(false)}>Закрыть</Button>
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => handleUpdateAppStatus('REJECTED')}
                                    >
                                        Отклонить
                                    </Button>
                                    <Button
                                        type="primary"
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                        icon={<CheckOutlined />}
                                        onClick={() => handleUpdateAppStatus('ACCEPTED')}
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
                                    <Button onClick={() => setIsAppViewVisible(false)}>Закрыть</Button>
                                </div>
                            )}
                        </Form>
                    </div>
                </Spin>
            )}
        </Modal>
        </>
    );
};

export default PlayerDossier;
