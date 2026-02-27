import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, applicationsApi, type User } from '../api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { Users, FileText, Shield, ShieldCheck, Ban, Search, Filter, MoreVertical, Edit, Key, Trash2, X, Copy, Mail, CheckCircle2, XCircle, Settings, AlertCircle, History, Send, Database, Download, Upload, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';


const AdminDashboardPage = () => {
    const { user, isAdmin, isModerator } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'applications' | 'badges' | 'settings' | 'logs'>('users');

    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [siteSettings, setSiteSettings] = useState<any>(null);

    // Filter states
    const [appStatusFilter, setAppStatusFilter] = useState<string>('PENDING');
    const [adminComment, setAdminComment] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [appSearch, setAppSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('');

    // Pagination states
    const [usersPage, setUsersPage] = useState(0);
    const [totalUsersPages, setTotalUsersPages] = useState(0);
    const [appsPage, setAppsPage] = useState(0);
    const [totalAppsPages, setTotalAppsPages] = useState(0);

    // Logs state
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [logsSearch, setLogsSearch] = useState('');
    const [logsPage, setLogsPage] = useState(0);
    const [totalLogsPages, setTotalLogsPages] = useState(0);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    // Modal & Action states
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState<any>(null);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [showAppModal, setShowAppModal] = useState(false);
    const [currentApp, setCurrentApp] = useState<any>(null);
    const [banReason, setBanReason] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
    const [showSecurityDossier, setShowSecurityDossier] = useState<number | null>(null);
    const [showWarningsModal, setShowWarningsModal] = useState(false);
    const [userWarnings, setUserWarnings] = useState<any[]>([]);
    const [newWarningReason, setNewWarningReason] = useState('');
    const [isIssuingWarning, setIsIssuingWarning] = useState(false);
    const [showResetSeasonModal, setShowResetSeasonModal] = useState(false);
    const [confirmTypeText, setConfirmTypeText] = useState('');
    const [confirmTotpCode, setConfirmTotpCode] = useState('');

    const [badgeForm, setBadgeForm] = useState({
        name: '',
        color: '#FFBF00',
        svgIcon: '',
        discordRoleId: ''
    });

    const handleUpdateSetting = async (key: string, value: any) => {
        try {
            const updated = { ...siteSettings, [key]: value };
            setSiteSettings(updated);
            await adminApi.updateSettings({ [key]: value });
        } catch (err) {
            console.error('Failed to update setting', err);
            // Revert on error
            const current = await adminApi.getSettings();
            setSiteSettings(current);
        }
    };

    const SettingToggle = ({ title, description, enabled, onChange }: any) => (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
                <h4 className="text-white font-bold text-sm">{title}</h4>
                <p className="text-gray-500 text-[10px]">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-story-gold shadow-[0_0_15px_rgba(255,191,0,0.3)]' : 'bg-white/10'}`}
            >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    useEffect(() => {
        if (editingBadge) {
            setBadgeForm({
                name: editingBadge.name,
                color: editingBadge.color,
                svgIcon: editingBadge.svgIcon,
                discordRoleId: editingBadge.discordRoleId || ''
            });
        } else {
            setBadgeForm({
                name: '',
                color: '#FFBF00',
                svgIcon: '',
                discordRoleId: ''
            });
        }
    }, [editingBadge, showBadgeModal]);

    const BadgePreview = () => (
        <div className="px-3 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-2.5 border border-white/10 shadow-lg" style={{ color: badgeForm.color, backgroundColor: `${badgeForm.color}15` }}>
            <div className="w-4 h-4 badge-icon flex-shrink-0" dangerouslySetInnerHTML={{ __html: badgeForm.svgIcon }} />
            <span className="truncate">{badgeForm.name || 'Название значка'}</span>
        </div>
    );

    const BadgeWithTooltip = ({ badge }: { badge: any }) => (
        <div className="group/badge relative flex items-center justify-center">
            <div
                className="flex items-center justify-center transition-all duration-300 cursor-help w-6 h-6"
                style={{ color: badge.color }}
            >
                <div className="w-4 h-4 badge-icon" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[100] shadow-2xl">
                {badge.name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-black" />
            </div>
        </div>
    );

    // IP Geo Information Helper
    const IPGeoInfo = ({ ip: rawIpInput, colorClasses }: { ip?: string, colorClasses: string }) => {
        const [geo, setGeo] = useState<{ city?: string; country_name?: string; flag?: string; ip?: string } | null>(null);
        const [loading, setLoading] = useState(false);

        const getFlagEmoji = (countryCode: string) => {
            if (!countryCode || countryCode.length !== 2) return '';
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }

        useEffect(() => {
            if (!rawIpInput || rawIpInput === '—') {
                setGeo(null);
                return;
            }

            const parts = rawIpInput.split(',');
            if (parts.length === 3) {
                const [cc, city, ip] = parts;
                setGeo({
                    city,
                    country_name: cc,
                    flag: getFlagEmoji(cc),
                    ip: ip
                });
                return;
            }

            const ip = rawIpInput;
            if (ip === '0:0:0:0:0:0:0:1' || ip === '127.0.0.1') {
                setGeo({ ip, city: 'Localhost', country_name: 'Local', flag: '💻' });
                return;
            };

            setLoading(true)
            fetch(`https://ipwho.is/${ip}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setGeo({
                            city: data.city,
                            country_name: data.country_name,
                            flag: data.flag.emoji,
                            ip: ip
                        });
                    } else {
                        setGeo({ ip });
                    }
                })
                .catch(() => setGeo({ ip }))
                .finally(() => setLoading(false));
        }, [rawIpInput]);

        if (!rawIpInput || rawIpInput === '—') return <code className="text-gray-600 font-bold text-lg">—</code>;

        const displayIp = geo?.ip || rawIpInput;

        return (
            <div className="flex items-center gap-2 min-w-0">
                <code className={`${colorClasses} text-base md:text-lg font-bold font-mono tracking-tight shrink-0`}>
                    {displayIp}
                </code>
                {geo?.flag && (
                    <span className="text-base shrink-0" title={`${geo.city}, ${geo.country_name}`}>
                        {geo.flag}
                    </span>
                )}
                {geo?.city && (
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                        {geo.city}
                    </span>
                )}
                {loading && <div className="w-3 h-3 border-2 border-white/20 border-t-story-gold rounded-full animate-spin shrink-0" />}
            </div>
        );
    };

    // Forms
    const [createUserForm, setCreateUserForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'ROLE_USER',
        discordNickname: '',
        minecraftNickname: '',
        bio: '',
        isPlayer: false
    });

    const [editUserForm, setEditUserForm] = useState({
        id: 0,
        username: '',
        email: '',
        role: 'ROLE_USER',
        discordNickname: '',
        minecraftNickname: '',
        bio: '',
        isPlayer: false
    });

    // Refs for clicking outside to close
    const desktopMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (openMenuUserId) {
                const isInsideDesktop = desktopMenuRef.current?.contains(target);
                const isInsideMobile = mobileMenuRef.current?.contains(target);

                if (!isInsideDesktop && !isInsideMobile) {
                    setOpenMenuUserId(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuUserId]);

    const handleResetPassword = async (id: number) => {
        if (!confirm('Сбросить пароль пользователю?')) return;
        try {
            const res = await adminApi.resetUserPassword(id);
            alert(res.message || 'Пароль успешно сброшен и отправлен на email пользователя');
            setOpenMenuUserId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to reset password');
        }
    };

    const handleUnlinkDiscord = async (id: number) => {
        if (!confirm('Отвязать Discord аккаунт пользователя?')) return;
        try {
            await adminApi.updateUser(id, { unlinkDiscord: true });
            alert('Discord аккаунт успешно отвязан');
            setOpenMenuUserId(null);
            refetchCurrentTab();
        } catch (err) {
            console.error(err);
            alert('Не удалось отвязать Discord');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createUser(createUserForm);
            alert('Пользователь создан!');
            setShowCreateUserModal(false);
            setCreateUserForm({ username: '', email: '', password: '', role: 'ROLE_USER', discordNickname: '', minecraftNickname: '', bio: '', isPlayer: false });
            refetchCurrentTab();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.updateUser(editUserForm.id, editUserForm);
            alert('Пользователь обновлен!');
            setShowEditUserModal(false);
            refetchCurrentTab();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update user');
        }
    };

    const openEditModal = (user: User) => {
        setEditUserForm({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            discordNickname: user.discordNickname || '',
            minecraftNickname: user.minecraftNickname || '',
            bio: user.bio || '',
            isPlayer: user.isPlayer || false
        });
        setSelectedUserId(user.id);
        setShowEditUserModal(true);
        setOpenMenuUserId(null);
    };

    const openBanModal = (userId: number) => {
        setSelectedUserId(userId);
        setBanReason('');
        setShowBanModal(true);
        setOpenMenuUserId(null);
    };

    const [loading, setLoading] = useState(false);

    const fetchUsers = async (page: number) => {
        try {
            setLoading(true);
            const res = await adminApi.getAllUsers(page, 50);
            setUsers(res.content);
            setTotalUsersPages(res.totalPages);
            setUsersPage(page);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (page: number) => {
        try {
            setLoading(true);
            const res = await applicationsApi.getAll(undefined, page, 50);
            setApplications(res.content);
            setTotalAppsPages(res.totalPages);
            setAppsPage(page);
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettingsAndBadges = async () => {
        if (!isAdmin) return;
        try {
            const promises: Promise<any>[] = [
                adminApi.getBadges(),
                adminApi.getSettings()
            ];
            const results = await Promise.all(promises);
            setAllBadges(results[0]);
            setSiteSettings(results[1]);
        } catch (err) {
            console.error('Failed to fetch settings/badges:', err);
        }
    };

    const refetchCurrentTab = () => {
        if (activeTab === 'users') fetchUsers(usersPage);
        else if (activeTab === 'applications') fetchApplications(appsPage);
    };

    const fetchLogs = async (page: number) => {
        try {
            setIsLogsLoading(true);
            const res = await adminApi.getLogs(logsSearch, page, 50);
            setAuditLogs(res.content);
            setTotalLogsPages(res.totalPages);
            setLogsPage(page);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLogsLoading(false);
        }
    };

    useEffect(() => {
        if (user && !isAdmin && !isModerator) {
            navigate('/');
        }
        if (user && (isAdmin || isModerator)) {
            if (activeTab === 'users') {
                fetchUsers(usersPage);
            } else if (activeTab === 'applications') {
                fetchApplications(appsPage);
            } else if (activeTab === 'logs') {
                fetchLogs(logsPage);
            }
        }
    }, [user, isAdmin, navigate, activeTab]);

    useEffect(() => {
        if (user && isAdmin) {
            fetchSettingsAndBadges();
        }
    }, [user, isAdmin]);

    useEffect(() => {
        if (activeTab === 'logs') {
            const timer = setTimeout(() => {
                fetchLogs(0);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [logsSearch]);

    const handleBan = async () => {
        if (!banReason) return alert('Введите причину бана');
        if (!selectedUserId) return;
        try {
            await adminApi.banUser(selectedUserId, banReason);
            setBanReason('');
            setSelectedUserId(null);
            setShowBanModal(false);
            refetchCurrentTab();
        } catch (err) {
            console.error(err);
            alert('Failed to ban user');
        }
    };

    const handleResetSeason = () => {
        if (!user?.totpEnabled) {
            alert('Для выполнения этого действия необходимо настроить 2FA (двухфакторную аутентификацию). Перейдите в настройки профиля.');
            if (confirm('Настроить 2FA сейчас?')) {
                navigate('/profile?tab=settings');
            }
            return;
        }
        setShowResetSeasonModal(true);
    };

    const submitResetSeason = async () => {
        const target = "STORYLEGENDS СИЛА!!! МИКОЛАЙЧИК МОГИЛА!!!! 22";
        if (confirmTypeText !== target) {
            alert('Текст подтверждения введен неверно! Соблюдайте регистр и знаки.');
            return;
        }
        if (!confirmTotpCode.trim()) {
            alert('Введите код 2FA');
            return;
        }

        try {
            await adminApi.resetSeason(confirmTotpCode);
            alert('Сезон успешно сброшен!');
            setShowResetSeasonModal(false);
            setConfirmTypeText('');
            setConfirmTotpCode('');
            refetchCurrentTab();
        } catch (err: any) {
            console.error('Failed to reset season', err);
            const errorMsg = err.response?.data?.message || 'Ошибка при сбросе сезона';
            alert(errorMsg);
        }
    };

    const handleUnban = async (id: number) => {
        if (!confirm('Разбанить пользователя?')) return;
        try {
            await adminApi.unbanUser(id);
            refetchCurrentTab();
            setOpenMenuUserId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to unban user');
        }
    };

    const fetchWarnings = async (userId: number) => {
        try {
            const data = await adminApi.getWarnings(userId);
            setUserWarnings(data || []);
        } catch (err) {
            console.error('Failed to fetch warnings', err);
        }
    };

    const openWarningsModal = (user: User) => {
        setSelectedUserId(user.id);
        fetchWarnings(user.id);
        setShowWarningsModal(true);
        setNewWarningReason('');
        setOpenMenuUserId(null);
    };

    const handleIssueWarning = async () => {
        if (!selectedUserId || !newWarningReason.trim()) return;
        setIsIssuingWarning(true);
        try {
            await adminApi.issueWarning(selectedUserId, newWarningReason);
            setNewWarningReason('');
            fetchWarnings(selectedUserId);
        } catch (err) {
            console.error('Failed to issue warning', err);
        } finally {
            setIsIssuingWarning(false);
        }
    };

    const handleRevokeWarning = async (warningId: number) => {
        try {
            await adminApi.revokeWarning(warningId);
            if (selectedUserId) fetchWarnings(selectedUserId);
        } catch (err) {
            console.error('Failed to revoke warning', err);
        }
    };

    const handleDeleteWarning = async (warningId: number) => {
        if (!confirm('Удалить предупреждение безвозвратно?')) return;
        try {
            await adminApi.deleteWarning(warningId);
            if (selectedUserId) fetchWarnings(selectedUserId);
        } catch (err) {
            console.error('Failed to delete warning', err);
        }
    };

    const handleAppStatus = async (id: number, status: string) => {
        try {
            if (status === 'REJECTED' && currentApp?.user?.id) {
                // If rejecting, remove isPlayer status
                await adminApi.updateUser(currentApp.user.id, { isPlayer: false });
            }
            await applicationsApi.updateStatus(id, status, adminComment);
            setAdminComment('');
            setShowAppModal(false);
            refetchCurrentTab();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.minecraftNickname?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.discordNickname?.toLowerCase().includes(userSearch.toLowerCase());

        const matchesRole = userRoleFilter === '' || u.role === userRoleFilter;

        return matchesSearch && matchesRole;
    });

    const handleBackupDatabase = async () => {
        try {
            const blob = await adminApi.downloadBackup();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slbackend-backup-${new Date().toISOString().slice(0, 10)}.sql`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error(err);
            alert('Не удалось скачать резервную копию. Убедитесь что на сервере установлен pg_dump');
        }
    };

    const filteredApplications = applications.filter(app => {
        const query = appSearch.toLowerCase();
        const matchesSearch = (
            app.firstName?.toLowerCase().includes(query) ||
            app.age?.toString().includes(query) ||
            app.user?.username?.toLowerCase().includes(query) ||
            app.id?.toString().includes(query) ||
            app.user?.minecraftNickname?.toLowerCase().includes(query)
        );

        const matchesStatus = appStatusFilter === '' || app.status === appStatusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalUsers: users.length,
        pendingApps: applications.filter(a => a.status === 'PENDING' || !a.status).length,
        activeUsers: users.filter(u => u.isPlayer).length,
        bannedUsers: users.filter(u => u.banned).length
    };

    return (
        <Layout>
            <>
                <SEO title="Admin Dashboard" description="Админ панель" />
                <div className="min-h-screen pt-10 md:pt-12 pb-4 px-2 md:px-6 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">

                        <div className="flex items-center gap-3 md:gap-4 mb-1.5 pl-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-900/50 flex items-center justify-center border border-red-500/20">
                                <Shield className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                            </div>
                            <h1 className="text-lg md:text-2xl font-black font-minecraft text-white leading-tight uppercase tracking-tight">Администрирование</h1>
                        </div>

                        <div className="bg-black/60 border border-white/5 rounded-xl md:rounded-3xl p-1.5 md:p-5 backdrop-blur-xl shadow-2xl flex-grow flex flex-col">

                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-2">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-4">
                                    <span className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold tracking-widest block mb-1">Пользователи</span>
                                    <span className="text-lg md:text-2xl font-bold text-white font-minecraft">{stats.totalUsers}</span>
                                </div>
                                <div className="bg-story-gold/10 border border-story-gold/20 rounded-xl p-3 md:p-4">
                                    <span className="text-story-gold text-[9px] md:text-[10px] uppercase font-bold tracking-widest block mb-1">Ожидают</span>
                                    <span className="text-lg md:text-2xl font-bold text-story-gold font-minecraft">{stats.pendingApps}</span>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 md:p-4">
                                    <span className="text-green-400 text-[9px] md:text-[10px] uppercase font-bold tracking-widest block mb-1">Игроки</span>
                                    <span className="text-lg md:text-2xl font-bold text-green-400 font-minecraft">{stats.activeUsers}</span>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 md:p-4">
                                    <span className="text-red-400 text-[9px] md:text-[10px] uppercase font-bold tracking-widest block mb-1">Баны</span>
                                    <span className="text-lg md:text-2xl font-bold text-red-400 font-minecraft">{stats.bannedUsers}</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex flex-wrap gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl border border-white/5 w-fit">
                                {[
                                    { id: 'users', label: 'Пользователи', icon: Users },
                                    { id: 'applications', label: 'Заявки', icon: FileText },
                                    ...(isAdmin ? [
                                        { id: 'badges', label: 'Значки', icon: Shield },
                                        { id: 'logs', label: 'Логи', icon: History },
                                        { id: 'settings', label: 'Настройки', icon: Settings },
                                    ] : []),
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-story-gold text-black shadow-lg shadow-story-gold/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-sm tracking-tight">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center flex-grow">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-story-gold"></div>
                                </div>
                            ) : activeTab === 'users' ? (
                                <div className="space-y-4 flex-grow flex flex-col overflow-hidden">
                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center w-full md:w-auto">
                                            <div className="relative w-full md:w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-story-gold/40" />
                                                <input
                                                    type="text"
                                                    placeholder="Поиск пользователей..."
                                                    value={userSearch}
                                                    onChange={e => setUserSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-story-gold/50 outline-none transition-all placeholder:text-gray-600"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                                                {['', 'ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN'].map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => setUserRoleFilter(role)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap ${userRoleFilter === role
                                                            ? 'bg-story-gold/20 text-story-gold border-story-gold/30'
                                                            : 'bg-white/5 text-gray-500 border-transparent hover:text-gray-300'
                                                            }`}
                                                    >
                                                        {role === '' ? 'Все' : role.replace('ROLE_', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowCreateUserModal(true)}
                                            className="bg-story-gold hover:bg-story-gold/80 text-black px-4 md:px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-story-gold/10 text-sm whitespace-nowrap order-first md:order-last"
                                        >
                                            <Users className="w-4 h-4" />
                                            Создать игрока
                                        </button>
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto flex-grow">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                                                    <th className="px-3 py-3">Пользователь</th>
                                                    <th className="px-3 py-3">Email</th>
                                                    <th className="px-3 py-3">Никнеймы</th>
                                                    <th className="px-3 py-3">Значки</th>
                                                    <th className="px-3 py-3">Роль</th>
                                                    <th className="px-3 py-3 text-center">2FA</th>
                                                    <th className="px-3 py-3">Статус</th>
                                                    <th className="px-3 py-3 text-right">Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-300">
                                                {filteredUsers.map(u => (
                                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar
                                                                    avatarUrl={u.avatarUrl}
                                                                    username={u.username}
                                                                    size="sm"
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-bold text-white leading-tight">{u.username}</div>
                                                                    <div className="text-[10px] text-gray-500 font-mono tracking-tight">#{u.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs">{u.email}</span>
                                                                <span className={`text-[10px] font-bold ${u.emailVerified ? 'text-green-500/60' : 'text-red-500/60'} uppercase mt-0.5`}>
                                                                    {u.emailVerified ? '✓ ПОДТВЕРЖДЕНО' : '✗ НЕ ПОДТВЕРЖДЕНО'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-xs">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-1.5"><span className="text-[10px] text-gray-600 font-bold uppercase w-5 text-right">MC:</span> <span className="text-gray-400">{u.minecraftNickname || '-'}</span></div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-gray-600 font-bold uppercase w-5 text-right">DS:</span>
                                                                    <span className="text-gray-400">{u.discordNickname || '-'}</span>
                                                                    <span className={`text-[10px] transition-colors ${u.inDiscordServer ? 'text-indigo-400' : 'text-gray-600 grayscale opacity-50'}`} title={u.inDiscordServer ? "На сервере" : "Не на сервере"}>🌐</span>
                                                                    <span title={u.discordVerified ? "Верифицирован" : "Не верифицирован"} className="flex items-center"><ShieldCheck className={`w-3 h-3 transition-colors ${u.discordVerified ? 'text-indigo-500' : 'text-gray-600 opacity-50'}`} /></span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex -space-x-1 transition-all">
                                                                {u.badges && u.badges.map((badge: any) => (
                                                                    <BadgeWithTooltip key={badge.id} badge={badge} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'ROLE_ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/10' : u.role === 'ROLE_MODERATOR' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/10' : 'bg-blue-500/20 text-blue-400 border border-blue-500/10'}`}>
                                                                {u.role.replace('ROLE_', '')}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <div className={`w-2 h-2 rounded-full mx-auto ${u.totpEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {u.banned ? (
                                                                <div className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-red-400 font-bold text-[10px] text-center">BANNED</div>
                                                            ) : u.isPlayer ? (
                                                                <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-green-400 font-bold text-[10px] text-center">PLAYER</div>
                                                            ) : (
                                                                <div className="text-gray-600 text-[10px] font-medium text-center opacity-50">REG</div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-right relative">
                                                            <button onClick={() => setOpenMenuUserId(openMenuUserId === u.id ? null : u.id)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group-hover:text-white">
                                                                <MoreVertical className="w-5 h-5 text-gray-500" />
                                                            </button>

                                                            {openMenuUserId === u.id && (
                                                                <div ref={desktopMenuRef} className="absolute right-3 top-12 z-50 w-56 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1" onClick={e => e.stopPropagation()}>
                                                                    {(!isModerator || (u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_MODERATOR')) && (
                                                                        <>
                                                                            {isAdmin && (
                                                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-gray-300">
                                                                                    <Edit className="w-4 h-4 text-story-gold" /> Редактировать
                                                                                </button>
                                                                            )}
                                                                            <button onClick={(e) => { e.stopPropagation(); handleResetPassword(u.id); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-yellow-400">
                                                                                <Key className="w-4 h-4" /> Сбросить пароль
                                                                            </button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleUnlinkDiscord(u.id); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-indigo-400">
                                                                                <div className="flex items-center justify-center w-4 h-4">
                                                                                    <span className="text-[10px] uppercase font-black tracking-widest leading-none border border-indigo-500/30 rounded px-0.5">DS</span>
                                                                                </div>
                                                                                Отвязать Discord
                                                                            </button>
                                                                            {u.banned ? (
                                                                                <button onClick={(e) => { e.stopPropagation(); handleUnban(u.id); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-green-400"><Shield className="w-4 h-4" /> Разбанить</button>
                                                                            ) : (
                                                                                <button onClick={(e) => { e.stopPropagation(); openBanModal(u.id); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-red-400"><Ban className="w-4 h-4" /> Забанить</button>
                                                                            )}
                                                                            {isAdmin && (
                                                                                <>
                                                                                    <div className="h-px bg-white/5 my-1" />
                                                                                    <button onClick={async (e) => { e.stopPropagation(); if (confirm('Удалить навсегда?')) { try { await adminApi.deleteUser(u.id); refetchCurrentTab(); } catch (err) { console.error(err); } } }} className="w-full text-left px-4 py-2 hover:bg-red-500/10 flex items-center gap-3 transition-colors text-xs font-bold text-red-600"><Trash2 className="w-4 h-4" /> Удалить</button>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    <button onClick={(e) => { e.stopPropagation(); setShowSecurityDossier(u.id); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-gray-300">
                                                                        <Shield className="w-4 h-4 text-blue-400" /> Security Dossier
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); openWarningsModal(u); }} className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 transition-colors text-xs font-bold text-gray-300">
                                                                        <AlertCircle className="w-4 h-4 text-orange-400" /> Предупреждения
                                                                    </button>

                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile List */}
                                    <div className="md:hidden space-y-3 flex-grow overflow-y-auto pr-1">
                                        {filteredUsers.map(u => (
                                            <div key={u.id} className="bg-[#0f0f0f]/80 border border-white/[0.04] rounded-2xl p-4 space-y-4 relative group hover:border-white/10 transition-all duration-300 shadow-xl overflow-visible">
                                                {/* Header Section */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="relative">
                                                            <UserAvatar
                                                                avatarUrl={u.avatarUrl}
                                                                username={u.username}
                                                                size="lg"
                                                                rounded="rounded-2xl"
                                                            />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <h3 className="font-bold text-white text-base leading-none tracking-tight truncate">{u.username}</h3>
                                                                <span className={`px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase tracking-widestAlpha border shrink-0 ${u.role === 'ROLE_ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/10' : u.role === 'ROLE_MODERATOR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/10'}`}>
                                                                    {u.role.replace('ROLE_', '')}
                                                                </span>
                                                                {u.banned && (
                                                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widestAlpha uppercase shrink-0">Banned</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-500 font-mono opacity-50">#{u.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setOpenMenuUserId(openMenuUserId === u.id ? null : u.id)}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${openMenuUserId === u.id ? 'bg-story-gold border-story-gold text-black' : 'bg-white/5 border-white/5 text-gray-400 active:scale-95'}`}
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Data Section */}
                                                <div className="bg-black/40 rounded-xl p-3 border border-white/[0.03] space-y-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                                                <Mail className="w-4 h-4 text-gray-500" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Email</p>
                                                                <p className="text-gray-300 text-xs font-medium truncate leading-none">{u.email}</p>
                                                            </div>
                                                        </div>
                                                        {u.emailVerified ? (
                                                            <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/10">
                                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                                <span className="text-[8px] font-black text-green-500 uppercase">Verified</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/10">
                                                                <XCircle className="w-3 h-3 text-red-500" />
                                                                <span className="text-[8px] font-black text-red-500 uppercase">Unverified</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.03] pt-3 mt-1">
                                                        <div className="flex items-center gap-3 w-1/2 min-w-0 pr-2 border-r border-white/[0.03]">
                                                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-[9px] font-black text-gray-500 uppercase">MC</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-gray-300 text-[11px] font-medium truncate leading-none mt-0.5">{u.minecraftNickname || '-'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-1/2 min-w-0 pl-1">
                                                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-[9px] font-black text-gray-500 uppercase">DS</span>
                                                            </div>
                                                            <div className="min-w-0 flex items-center gap-1.5 mt-0.5">
                                                                <p className="text-gray-300 text-[11px] font-medium truncate leading-none">{u.discordNickname || '-'}</p>
                                                                {u.discordNickname && (
                                                                    <>
                                                                        <span className={`text-[10px] leading-none shrink-0 ${u.inDiscordServer ? 'text-indigo-400' : 'text-gray-600 grayscale opacity-50'}`} title={u.inDiscordServer ? "На сервере" : "Не на сервере"}>🌐</span>
                                                                        <span title={u.discordVerified ? "Верифицирован" : "Не верифицирован"} className="flex items-center shrink-0">
                                                                            <ShieldCheck className={`w-3 h-3 ${u.discordVerified ? 'text-indigo-500' : 'text-gray-600 opacity-50'}`} />
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Badges Section */}
                                                {u.badges && u.badges.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 px-0.5 pt-1">
                                                        {u.badges.map(badge => (
                                                            <BadgeWithTooltip key={badge.id} badge={badge} />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Dropdown Menu - Inline for mobile */}
                                                {openMenuUserId === u.id && (
                                                    <div ref={mobileMenuRef} className="mt-3 bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-inner py-1.5 animate-fadeIn" onClick={e => e.stopPropagation()}>
                                                        <div className="px-4 py-2 border-b border-white/5 mb-1">
                                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Действия</p>
                                                        </div>
                                                        {(!isModerator || (u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_MODERATOR')) && (
                                                            <>
                                                                {isAdmin && (
                                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-[11px] font-bold text-gray-300 group/item">
                                                                        <div className="w-7 h-7 bg-story-gold/10 rounded-lg flex items-center justify-center group-hover/item:bg-story-gold/20 transition-colors shrink-0">
                                                                            <Edit className="w-3.5 h-3.5 text-story-gold" />
                                                                        </div>
                                                                        Редактировать
                                                                    </button>
                                                                )}
                                                                <button onClick={(e) => { e.stopPropagation(); handleResetPassword(u.id); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-[11px] font-bold text-gray-300 group/item">
                                                                    <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover/item:bg-yellow-500/20 transition-colors shrink-0">
                                                                        <Key className="w-3.5 h-3.5 text-yellow-400" />
                                                                    </div>
                                                                    Сбросить пароль
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleUnlinkDiscord(u.id); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-[11px] font-bold text-indigo-400 group/item">
                                                                    <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover/item:bg-indigo-500/20 transition-colors shrink-0">
                                                                        <span className="text-[8px] uppercase font-black tracking-widest leading-none">DS</span>
                                                                    </div>
                                                                    Отвязать Discord
                                                                </button>
                                                                <div className="h-px bg-white/5 mx-2 my-1" />
                                                                {u.banned ? (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleUnban(u.id); }} className="w-full text-left px-4 py-3 hover:bg-green-500/10 flex items-center gap-3 transition-colors text-[11px] font-bold text-green-400">
                                                                        <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                                            <Shield className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        Разбанить
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={(e) => { e.stopPropagation(); openBanModal(u.id); }} className="w-full text-left px-4 py-3 hover:bg-red-500/10 flex items-center gap-3 transition-colors text-[11px] font-bold text-red-500">
                                                                        <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                                            <Ban className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        Забанить
                                                                    </button>
                                                                )}
                                                                {isAdmin && (
                                                                    <>
                                                                        <div className="h-px bg-white/5 mx-2 my-1" />
                                                                        <button onClick={async (e) => { e.stopPropagation(); if (confirm('Удалить навсегда?')) { try { await adminApi.deleteUser(u.id); refetchCurrentTab(); } catch (err) { console.error(err); } } }} className="w-full text-left px-4 py-3 hover:bg-red-500/10 flex items-center gap-3 transition-colors text-[11px] font-bold text-red-600 group/del">
                                                                            <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center group-hover/del:bg-red-500/20 transition-colors shrink-0">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </div>
                                                                            Удалить
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); setShowSecurityDossier(u.id); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-[11px] font-bold text-gray-300 group/item">
                                                            <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover/item:bg-blue-500/20 transition-colors shrink-0">
                                                                <Shield className="w-3.5 h-3.5 text-blue-400" />
                                                            </div>
                                                            Security Dossier
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); openWarningsModal(u); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors text-[11px] font-bold text-gray-300 group/item">
                                                            <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover/item:bg-orange-500/20 transition-colors shrink-0">
                                                                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                                                            </div>
                                                            Предупреждения
                                                        </button>
                                                        <div className="h-px bg-white/5 mx-2 my-1" />
                                                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuUserId(null); }} className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-colors text-[11px] font-bold text-gray-500">
                                                            <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                                                <X className="w-3.5 h-3.5" />
                                                            </div>
                                                            Закрыть
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center gap-2 py-4 border-t border-white/5 mt-auto shrink-0">
                                        <button
                                            onClick={() => fetchUsers(Math.max(0, usersPage - 1))}
                                            disabled={usersPage === 0}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors border border-white/10"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                                        </button>
                                        <div className="flex items-center px-4 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-xs font-mono text-gray-400 font-bold">
                                                {totalUsersPages > 0 ? usersPage + 1 : 0} / {totalUsersPages}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => fetchUsers(Math.min(totalUsersPages - 1, usersPage + 1))}
                                            disabled={usersPage >= totalUsersPages - 1}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors border border-white/10"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : activeTab === 'applications' ? (
                                <div className="space-y-3 md:space-y-4 flex-grow flex flex-col overflow-hidden">
                                    {/* Filters */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                                            <div className="flex items-center gap-2 text-gray-500 mr-1 shrink-0">
                                                <Filter className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Статус:</span>
                                            </div>
                                            {['', 'PENDING', 'ACCEPTED', 'REJECTED'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setAppStatusFilter(status)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold transition-all border whitespace-nowrap ${appStatusFilter === status
                                                        ? 'bg-story-gold/20 text-story-gold border-story-gold/30'
                                                        : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                                        }`}
                                                >
                                                    {status === '' ? 'Все' : status}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative flex-grow max-w-sm md:ml-auto">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Поиск по имени или ID..."
                                                value={appSearch}
                                                onChange={(e) => setAppSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-story-gold/50 outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/20 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden shadow-xl flex-grow flex flex-col min-h-0">
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-y-auto flex-grow">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                                                        <th className="px-6 py-4 font-medium">Кандидат</th>
                                                        <th className="px-6 py-4 font-medium">ID / Дата</th>
                                                        <th className="px-6 py-4 font-medium">Статус</th>
                                                        <th className="px-6 py-4 font-medium text-right text-story-gold uppercase text-[10px] tracking-widestAlpha">Детали</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredApplications.map(app => (
                                                        <tr
                                                            key={app.id}
                                                            onClick={() => { setCurrentApp(app); setShowAppModal(true); setAdminComment(app.adminComment || ''); }}
                                                            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-white font-bold">{app.firstName} ({app.age} лет)</span>
                                                                    <span className="text-xs text-gray-500">@{app.user.username}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-400 text-xs font-mono">#{app.id}</span>
                                                                    <span className="text-[10px] text-gray-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${app.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                                                    {app.status || 'PENDING'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button className="text-story-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="w-5 h-5 ml-auto text-gray-500" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile List */}
                                        <div className="md:hidden overflow-y-auto flex-grow p-2 space-y-2">
                                            {filteredApplications.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500">Заявок нет</div>
                                            ) : (
                                                filteredApplications.map(app => (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => { setCurrentApp(app); setShowAppModal(true); setAdminComment(app.adminComment || ''); }}
                                                        className="bg-[#0f0f0f]/80 border border-white/[0.04] rounded-2xl p-4 active:scale-[0.98] transition-all duration-200 relative overflow-hidden group shadow-lg"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-minecraft text-gray-400">
                                                                    {app.firstName?.[0]}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-white font-bold text-sm leading-tight">{app.firstName} ({app.age})</h4>
                                                                    <p className="text-[10px] text-gray-500 font-medium">@{app.user?.username}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${app.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400 border-green-500/10' :
                                                                app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                                                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/10'
                                                                }`}>
                                                                {app.status || 'PENDING'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-black/40 rounded-lg px-3 py-2 border border-white/[0.03]">
                                                            <span className="text-[9px] font-mono text-gray-500">REF: #{app.id}</span>
                                                            <span className="text-[9px] font-medium text-gray-500 flex items-center gap-1.5">
                                                                <FileText className="w-3 h-3 opacity-50" />
                                                                {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex justify-center gap-2 py-4 border-t border-white/5 mt-auto bg-black/20 shrink-0">
                                            <button
                                                onClick={() => fetchApplications(Math.max(0, appsPage - 1))}
                                                disabled={appsPage === 0}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors border border-white/10"
                                            >
                                                <ChevronLeft className="w-5 h-5 text-gray-400" />
                                            </button>
                                            <div className="flex items-center px-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-xs font-mono text-gray-400 font-bold">
                                                    {totalAppsPages > 0 ? appsPage + 1 : 0} / {totalAppsPages}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => fetchApplications(Math.min(totalAppsPages - 1, appsPage + 1))}
                                                disabled={appsPage >= totalAppsPages - 1}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors border border-white/10"
                                            >
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'badges' ? (
                                <div className="space-y-4 flex-grow flex flex-col overflow-hidden animate-fadeIn">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-base font-bold text-white uppercase tracking-tight">Управление значками</h3>
                                        <button
                                            onClick={() => { setEditingBadge(null); setShowBadgeModal(true); }}
                                            className="bg-story-gold text-black px-4 py-2 rounded-xl font-bold text-sm"
                                        >
                                            Создать значок
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
                                        {allBadges.map(badge => (
                                            <div key={badge.id} className="bg-[#0c0c0c] border border-white/5 rounded-xl p-2.5 flex items-center justify-between group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className="w-11 h-11 md:w-12 md:h-12 badge-icon bg-black shadow-inner rounded-xl p-1.5"
                                                        style={{ color: badge.color }}
                                                        dangerouslySetInnerHTML={{ __html: badge.svgIcon }}
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-white truncate">{badge.name}</h4>
                                                        <p className="text-[10px] text-gray-500 font-mono">{badge.color}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setEditingBadge(badge); setShowBadgeModal(true); }}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Удалить значок?')) {
                                                                await adminApi.deleteBadge(badge.id);
                                                                refetchCurrentTab();
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : activeTab === 'settings' ? (
                                <div className="space-y-6 animate-fadeIn w-full overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <h2 className="text-2xl font-bold text-white font-minecraft">Настройки сайта</h2>
                                        <p className="text-gray-500 text-sm font-medium">Конфигурация поведения сервера и уведомлений</p>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
                                        {/* Section: Main Site Flow */}
                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5 h-fit">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-story-gold/10 flex items-center justify-center border border-story-gold/20">
                                                    <Settings className="w-4 h-4 text-story-gold" />
                                                </div>
                                                <h3 className="text-white font-bold uppercase tracking-widestAlpha text-[10px]">Основной поток</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <SettingToggle
                                                    title="Регистрация"
                                                    description="Доступность создания новых аккаунтов"
                                                    enabled={siteSettings?.registrationOpen}
                                                    onChange={() => handleUpdateSetting('registrationOpen', !siteSettings.registrationOpen)}
                                                />
                                                <SettingToggle
                                                    title="Заявки"
                                                    description="Возможность подачи новых анкет игроками"
                                                    enabled={siteSettings?.applicationsOpen}
                                                    onChange={() => handleUpdateSetting('applicationsOpen', !siteSettings.applicationsOpen)}
                                                />

                                                <div className="pt-4 border-t border-white/5 mt-4">
                                                    <button
                                                        onClick={handleResetSeason}
                                                        className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-500 hover:text-red-400 font-bold py-3 rounded-xl border border-red-500/30 transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <RefreshCw className="w-5 h-5" />
                                                        НОВЫЙ СЕЗОН (СБРОС ЗАЯВОК)
                                                    </button>
                                                    <p className="text-gray-500 text-[10px] mt-2 text-center">Сбрасывает статус сезона у всех пользователей, позволяя им отправлять новые заявки.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: Security & Bans */}
                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5 h-fit">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                    <Ban className="w-4 h-4 text-red-400" />
                                                </div>
                                                <h3 className="text-white font-bold uppercase tracking-widestAlpha text-[10px]">Безопасность и Варинги</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-bold text-sm">Макс. предупреждений</span>
                                                        <input
                                                            type="number"
                                                            value={siteSettings?.maxWarningsBeforeBan || 3}
                                                            onChange={(e) => handleUpdateSetting('maxWarningsBeforeBan', parseInt(e.target.value))}
                                                            className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-story-gold outline-none focus:border-story-gold/50"
                                                        />
                                                    </div>
                                                    <p className="text-gray-500 text-[10px]">Количество активных варнов до автоматического бана.</p>
                                                </div>

                                                <SettingToggle
                                                    title="Авто-бан"
                                                    description="Банить при достижении лимита варнов"
                                                    enabled={siteSettings?.autoBanOnMaxWarnings}
                                                    onChange={() => handleUpdateSetting('autoBanOnMaxWarnings', !siteSettings.autoBanOnMaxWarnings)}
                                                />
                                            </div>
                                        </div>

                                        {/* Section: Notifications */}
                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5 xl:col-span-2">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                    <Mail className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <h3 className="text-white font-bold uppercase tracking-widestAlpha text-[10px]">Уведомления (Email & Discord)</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <SettingToggle
                                                        title="Email при варне"
                                                        description="Отправлять письмо при выдаче предупреждения"
                                                        enabled={siteSettings?.sendEmailOnWarning}
                                                        onChange={() => handleUpdateSetting('sendEmailOnWarning', !siteSettings.sendEmailOnWarning)}
                                                    />
                                                    <SettingToggle
                                                        title="Email при бане"
                                                        description="Отправлять письмо при блокировке аккаунта"
                                                        enabled={siteSettings?.sendEmailOnBan}
                                                        onChange={() => handleUpdateSetting('sendEmailOnBan', !siteSettings.sendEmailOnBan)}
                                                    />
                                                    <SettingToggle
                                                        title="Email: Заявка одобрена"
                                                        description="Уведомление об успешном прохождении анкеты"
                                                        enabled={siteSettings?.sendEmailOnApplicationApproved}
                                                        onChange={() => handleUpdateSetting('sendEmailOnApplicationApproved', !siteSettings.sendEmailOnApplicationApproved)}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <SettingToggle
                                                        title="Discord ЛС при варне"
                                                        description="Отправлять личное сообщение в Discord"
                                                        enabled={siteSettings?.sendDiscordDmOnWarning}
                                                        onChange={() => handleUpdateSetting('sendDiscordDmOnWarning', !siteSettings.sendDiscordDmOnWarning)}
                                                    />
                                                    <SettingToggle
                                                        title="Discord ЛС при бане"
                                                        description="Сообщение в Discord при блокировке"
                                                        enabled={siteSettings?.sendDiscordDmOnBan}
                                                        onChange={() => handleUpdateSetting('sendDiscordDmOnBan', !siteSettings.sendDiscordDmOnBan)}
                                                    />
                                                    <SettingToggle
                                                        title="Email: Заявка отклонена"
                                                        description="Уведомление об отказе в заявке"
                                                        enabled={siteSettings?.sendEmailOnApplicationRejected}
                                                        onChange={() => handleUpdateSetting('sendEmailOnApplicationRejected', !siteSettings.sendEmailOnApplicationRejected)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: System & Database */}
                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5 xl:col-span-2">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                    <Database className="w-4 h-4 text-green-400" />
                                                </div>
                                                <h3 className="text-white font-bold uppercase tracking-widestAlpha text-[10px]">Система и База данных</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    onClick={handleBackupDatabase}
                                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" /> Скачать резервную копию
                                                </button>
                                                <button
                                                    onClick={() => alert("Восстановление БД временно недоступно из-за ограничений архитектуры. Используйте консоль сервера.")}
                                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                                >
                                                    <Upload className="w-4 h-4" /> Восстановить из копии
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'logs' ? (
                                <div className="space-y-4 flex-grow flex flex-col overflow-hidden animate-fadeIn">
                                    {/* Logs Filter */}
                                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-story-gold/40" />
                                            <input
                                                type="text"
                                                placeholder="Поиск по логам (событие, ник, детали)..."
                                                value={logsSearch}
                                                onChange={e => setLogsSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-story-gold/50 outline-none transition-all placeholder:text-gray-600"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={logsPage === 0 || isLogsLoading}
                                                onClick={() => fetchLogs(logsPage - 1)}
                                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widestAlpha bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                {logsPage + 1} / {totalLogsPages || 1}
                                            </span>
                                            <button
                                                disabled={logsPage >= totalLogsPages - 1 || isLogsLoading}
                                                onClick={() => fetchLogs(logsPage + 1)}
                                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl flex-grow flex flex-col min-h-0">
                                        <div className="overflow-y-auto flex-grow custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-white/10">
                                                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widestAlpha">
                                                        <th className="px-6 py-4">Дата и Время</th>
                                                        <th className="px-6 py-4">Инициатор</th>
                                                        <th className="px-6 py-4">Событие</th>
                                                        <th className="px-6 py-4">Детали</th>
                                                        <th className="px-6 py-4">Объект</th>
                                                        <th className="px-6 py-4">Источник (IP/UA)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {isLogsLoading ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-story-gold mx-auto"></div>
                                                            </td>
                                                        </tr>
                                                    ) : auditLogs.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-medium italic">Логи не найдены</td>
                                                        </tr>
                                                    ) : auditLogs.map(log => (
                                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group/log">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-white font-bold">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                                    <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-lg bg-story-gold/10 flex items-center justify-center text-[10px] font-black text-story-gold border border-story-gold/20">
                                                                        {log.actorUsername?.charAt(0) || '?'}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-gray-300 group-hover/log:text-white transition-colors">{log.actorUsername || 'Система'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border ${log.actionType.startsWith('ADMIN_')
                                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                    : log.actionType.startsWith('SECURITY_')
                                                                        ? 'bg-red-600 text-white border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse'
                                                                        : log.actionType.startsWith('USER_')
                                                                            ? 'bg-story-gold/10 text-story-gold border-story-gold/20'
                                                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                    }`}>
                                                                    {log.actionType.replace('ADMIN_', '').replace('SECURITY_', '').replace('USER_', '')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm xl:max-w-md line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                                                    {log.details}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {log.targetUserId ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-gray-300 group-hover/log:text-white transition-colors">{log.targetUsername}</span>
                                                                            <span className="text-[9px] text-gray-600 font-mono tracking-tighter">ID: {log.targetUserId}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-700 text-[10px] tracking-widest">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col gap-1">
                                                                    {log.ipAddress ? (
                                                                        <IPGeoInfo ip={log.ipAddress} colorClasses="text-gray-400 group-hover/log:text-gray-300 transition-colors" />
                                                                    ) : (
                                                                        <span className="text-gray-700 text-[10px] tracking-widest">—</span>
                                                                    )}
                                                                    {log.userAgent && (
                                                                        <span className="text-[9px] text-gray-600 font-mono truncate max-w-[120px] cursor-help hover:text-gray-400 transition-colors" title={log.userAgent}>
                                                                            {log.userAgent.length > 20 ? log.userAgent.substring(0, 20) + '...' : log.userAgent}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Create User Modal */}
                {
                    showCreateUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
                                <h3 className="text-xl font-bold text-white mb-6">Создать пользователя</h3>

                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={createUserForm.username}
                                            onChange={e => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={createUserForm.email}
                                            onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={createUserForm.password}
                                            onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Minecraft Nick</label>
                                            <input
                                                type="text"
                                                value={createUserForm.minecraftNickname}
                                                onChange={e => setCreateUserForm({ ...createUserForm, minecraftNickname: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Discord Nick</label>
                                            <input
                                                type="text"
                                                value={createUserForm.discordNickname}
                                                onChange={e => setCreateUserForm({ ...createUserForm, discordNickname: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                        <select
                                            value={createUserForm.role}
                                            onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        >
                                            <option value="ROLE_USER">User</option>
                                            <option value="ROLE_ADMIN">Admin</option>
                                            <option value="ROLE_MODERATOR">Moderator</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                        <input
                                            type="checkbox"
                                            id="createIsPlayer"
                                            checked={createUserForm.isPlayer}
                                            onChange={e => setCreateUserForm({ ...createUserForm, isPlayer: e.target.checked })}
                                            className="w-5 h-5 rounded border-white/10 text-story-gold focus:ring-story-gold bg-black/50"
                                        />
                                        <label htmlFor="createIsPlayer" className="text-sm font-medium text-gray-300 cursor-pointer">
                                            Статус игрока (Whitelist)
                                        </label>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button type="submit" className="flex-1 bg-story-gold hover:bg-story-gold-light text-black font-bold py-2 rounded-xl transition-colors">Создать</button>
                                        <button type="button" onClick={() => setShowCreateUserModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition-colors">Отмена</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Edit User Modal */}
                {
                    showEditUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
                                <h3 className="text-xl font-bold text-white mb-6">Редактировать пользователя</h3>

                                <form onSubmit={handleEditUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={editUserForm.username}
                                            onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={editUserForm.email}
                                            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Minecraft Nick</label>
                                            <input
                                                type="text"
                                                value={editUserForm.minecraftNickname}
                                                onChange={e => setEditUserForm({ ...editUserForm, minecraftNickname: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Discord Nick</label>
                                            <input
                                                type="text"
                                                value={editUserForm.discordNickname}
                                                onChange={e => setEditUserForm({ ...editUserForm, discordNickname: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                                        <textarea
                                            value={editUserForm.bio}
                                            onChange={e => setEditUserForm({ ...editUserForm, bio: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none h-24 resize-none"
                                        />
                                    </div>
                                    {isAdmin && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                                <select
                                                    value={editUserForm.role}
                                                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                                                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                                >
                                                    <option value="ROLE_USER">User</option>
                                                    <option value="ROLE_ADMIN">Admin</option>
                                                    <option value="ROLE_MODERATOR">Moderator</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <input
                                                    type="checkbox"
                                                    id="isPlayer"
                                                    checked={editUserForm.isPlayer}
                                                    onChange={e => setEditUserForm({ ...editUserForm, isPlayer: e.target.checked })}
                                                    className="w-5 h-5 rounded border-white/10 text-story-gold focus:ring-story-gold bg-black/50"
                                                />
                                                <label htmlFor="isPlayer" className="text-sm font-medium text-gray-300 cursor-pointer">
                                                    Статус игрока (Whitelist)
                                                </label>
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Управление значками</span>
                                        <div className="flex flex-wrap gap-2">
                                            {allBadges.map(badge => {
                                                const hasBadge = users.find(u => u.id === editUserForm.id)?.badges?.some(b => b.id === badge.id);
                                                return (
                                                    <button
                                                        key={badge.id}
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                if (hasBadge) {
                                                                    await adminApi.removeBadge(editUserForm.id, badge.id);
                                                                } else {
                                                                    await adminApi.assignBadge(editUserForm.id, badge.id);
                                                                }
                                                                refetchCurrentTab();
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${hasBadge
                                                            ? 'bg-story-gold/10 border-story-gold/40 text-story-gold shadow-[0_0_15px_rgba(255,191,0,0.1)]'
                                                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="w-4 h-4 badge-icon flex-shrink-0" style={{ color: hasBadge ? badge.color : 'inherit' }} dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                                                        <span className="truncate">{badge.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button type="submit" className="flex-1 bg-story-gold hover:bg-story-gold-light text-black font-bold py-2 rounded-xl transition-colors">Сохранить</button>
                                        <button type="button" onClick={() => setShowEditUserModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition-colors">Отмена</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Ban User Modal */}
                {
                    showBanModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-fadeIn">
                                <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                                    <Ban className="w-6 h-6" /> Заблокировать
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Причина блокировки</label>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            className="w-full px-4 py-2 bg-black/50 border border-red-500/30 rounded-xl text-white focus:border-red-500 outline-none"
                                            placeholder="Нарушение правил..."
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleBan} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl transition-colors">Забанить</button>
                                        <button onClick={() => setShowBanModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition-colors">Отмена</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Application Details Modal */}
                {
                    showAppModal && currentApp && (
                        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-[1700px] shadow-2xl relative animate-fadeIn my-4 flex flex-col">
                                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1.5 h-8 rounded-full ${currentApp.status === 'ACCEPTED' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' :
                                            currentApp.status === 'REJECTED' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                                                'bg-story-gold shadow-[0_0_20px_rgba(255,191,0,0.2)]'
                                            }`} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${currentApp.status === 'ACCEPTED' ? 'text-green-400 border border-green-500/10 bg-green-500/5' :
                                                    currentApp.status === 'REJECTED' ? 'text-red-400 border border-red-500/10 bg-red-500/5' :
                                                        'text-story-gold border border-story-gold/10 bg-story-gold/5'
                                                    }`}>
                                                    {currentApp.status || 'PENDING'}
                                                </span>
                                                <span className="text-gray-500 text-[11px] font-mono uppercase tracking-widest opacity-60">Application #{currentApp.id}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{currentApp.firstName} ({currentApp.age} лет)</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAppModal(false)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-gray-400 hover:text-white group"
                                    >
                                        <MoreVertical className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                                        {/* Column 1: Deep Dive Texts */}
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-story-gold/20 rounded-full group-hover:bg-story-gold/50 transition-colors" />
                                                <span className="text-[10px] text-story-gold uppercase font-bold tracking-[0.2em] block mb-1.5 px-2">Почему мы?</span>
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                                                    <p className="text-gray-200 leading-relaxed text-[15px] break-all">
                                                        {currentApp.whyUs}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-story-gold/20 rounded-full group-hover:bg-story-gold/50 transition-colors" />
                                                <span className="text-[10px] text-story-gold uppercase font-bold tracking-[0.2em] block mb-1.5 px-2">О себе:</span>
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                                                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-[15px] break-all">
                                                        {currentApp.additionalInfo}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-story-gold/20 rounded-full group-hover:bg-story-gold/50 transition-colors" />
                                                    <span className="text-[10px] text-story-gold uppercase font-bold tracking-[0.2em] block mb-1.5 px-2">Источник:</span>
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                                                        <p className="text-gray-200 text-sm break-all">{currentApp.source}</p>
                                                    </div>
                                                </div>
                                                <div className="relative group">
                                                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-story-gold/20 rounded-full group-hover:bg-story-gold/50 transition-colors" />
                                                    <span className="text-[10px] text-story-gold uppercase font-bold tracking-[0.2em] block mb-1.5 px-2">Самооценка:</span>
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner flex items-center justify-between">
                                                        <span className="text-xl font-bold text-story-gold">{currentApp.selfRating} / 10</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: User Persona */}
                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl p-4 border border-white/10 shadow-2xl space-y-5">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] block mb-4 border-b border-white/5 pb-1.5">ПРОФИЛЬ ИГРОКА</span>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl border border-white/5">
                                                            <span className="text-xs text-gray-500 uppercase tracking-widest font-black opacity-60">Ник на сайте:</span>
                                                            <span className="text-story-gold font-bold text-sm">{currentApp.user?.username || '—'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl border border-white/5">
                                                            <span className="text-xs text-gray-500 uppercase tracking-widest font-black opacity-60">Email:</span>
                                                            <span className="text-white break-all text-sm font-medium">{currentApp.user?.email || '—'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl border border-white/5">
                                                            <span className="text-xs text-gray-500 uppercase tracking-widest font-black opacity-60">Discord:</span>
                                                            <span className="text-blue-400 font-bold text-sm">{currentApp.user?.discordNickname || '—'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl border border-white/5">
                                                            <span className="text-xs text-gray-500 uppercase tracking-widest font-black opacity-60">Minecraft:</span>
                                                            <span className="text-green-400 font-bold text-sm">{currentApp.user?.minecraftNickname || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-center">
                                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border ${currentApp.makeContent ? 'text-red-500 border-red-500/20 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'text-gray-400 border-white/5 bg-white/5'}`}>
                                                            {currentApp.makeContent ? '🎥 CONTENT CREATOR' : 'STANDARD PLAYER'}
                                                        </span>
                                                    </div>
                                                    {currentApp.user?.isPlayer && (
                                                        <div className="flex justify-center">
                                                            <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border border-green-500/20 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                                                ✓ WHITELISTED PLAYER
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Past Applications */}
                                            {(() => {
                                                const pastApps = applications.filter(app => app.user?.id === currentApp.user?.id && app.id !== currentApp.id);
                                                if (pastApps.length === 0) return null;
                                                return (
                                                    <div className="bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl p-4 border border-white/10 shadow-2xl space-y-4">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] block border-b border-white/5 pb-1.5">ПРОШЛЫЕ ЗАЯВКИ</span>
                                                        <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                            {pastApps.map(app => (
                                                                <button
                                                                    key={app.id}
                                                                    onClick={() => setCurrentApp(app)}
                                                                    className="w-full text-left bg-black/40 hover:bg-black/60 p-3 rounded-xl border border-white/5 transition-all group"
                                                                >
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[10px] font-mono text-gray-400">#{app.id}</span>
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${app.status === 'ACCEPTED' ? 'text-green-500' :
                                                                            app.status === 'REJECTED' ? 'text-red-500' :
                                                                                'text-story-gold'
                                                                            }`}>{app.status || 'PENDING'}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                                                        {new Date(app.createdAt).toLocaleString()}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Column 3: The Verdict & Meta */}
                                        <div className="space-y-4">
                                            <div className="bg-story-gold/[0.03] rounded-2xl p-4 border border-story-gold/20 shadow-[0_0_40px_rgba(255,191,0,0.02)] space-y-4">
                                                <h4 className="text-story-gold font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Shield className="w-4 h-4 opacity-50" /> VERDICT
                                                </h4>
                                                <textarea
                                                    placeholder="Введите ваш вердикт/комментарий..."
                                                    value={adminComment}
                                                    onChange={(e) => setAdminComment(e.target.value)}
                                                    readOnly={currentApp.status && currentApp.status !== 'PENDING'}
                                                    className={`w-full h-40 p-4 bg-black/60 border border-white/10 rounded-xl text-base text-white focus:border-story-gold/50 focus:ring-4 focus:ring-story-gold/5 outline-none transition-all resize-none shadow-inner ${currentApp.status && currentApp.status !== 'PENDING' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                                {(!currentApp.status || currentApp.status === 'PENDING') ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleAppStatus(currentApp.id, 'ACCEPTED')}
                                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[10px]"
                                                        >
                                                            Принять
                                                        </button>
                                                        <button
                                                            onClick={() => handleAppStatus(currentApp.id, 'REJECTED')}
                                                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all shadow-xl shadow-red-900/40 uppercase tracking-widest text-[10px]"
                                                        >
                                                            Отклонить
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                                            Action Locked: {currentApp.status}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-4 shadow-xl">
                                                <span className="text-xs text-gray-500 uppercase font-black tracking-[0.2em] block border-b border-white/5 pb-1.5">METADATA</span>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-gray-500 font-black uppercase tracking-widest opacity-60">Application ID:</span>
                                                            <span className="text-xs text-gray-300 font-mono break-all">#{currentApp.id}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-gray-500 font-black uppercase tracking-widest opacity-60">Internal User ID:</span>
                                                            <span className="text-xs text-gray-300 font-mono break-all">{currentApp.user?.id || '—'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-gray-500 font-black uppercase tracking-widest opacity-60">Submitted Date:</span>
                                                            <p className="text-xs text-gray-300 font-medium tracking-tight text-white/80">
                                                                {new Date(currentApp.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Security Dossier Modal */}
                {
                    showSecurityDossier && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-5xl w-full shadow-2xl relative animate-fadeIn overflow-hidden flex flex-col max-h-[95vh]">
                                {/* Header */}
                                <div className="p-6 pb-4 flex justify-between items-center border-b border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 shadow-inner">
                                            <Shield className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">Security Dossier</h3>
                                            <p className="text-gray-400 text-sm mt-0.5 font-medium">
                                                User ID: <span className="text-blue-400">#ID-{showSecurityDossier}</span> • <span className="text-white">{users.find(u => u.id === showSecurityDossier)?.username}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSecurityDossier(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-white/5"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content Area */}
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-black/20">
                                    {users.find(u => u.id === showSecurityDossier) ? (
                                        <div className="space-y-4">
                                            {/* Registration Section */}
                                            <div className="bg-neutral-800/40 p-3 rounded-xl border border-white/5 space-y-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Registration Details</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-gray-500 uppercase font-black">IP Address</span>
                                                            <button
                                                                onClick={async () => {
                                                                    const rawIp = users.find(u => u.id === showSecurityDossier)?.registrationIp || '';
                                                                    const copyVal = rawIp.includes(',') ? rawIp.split(',')[2] : rawIp;
                                                                    await navigator.clipboard.writeText(copyVal);
                                                                    alert('IP Address Copied');
                                                                }}
                                                                className="text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <IPGeoInfo
                                                            ip={users.find(u => u.id === showSecurityDossier)?.registrationIp}
                                                            colorClasses="text-blue-400"
                                                        />
                                                    </div>
                                                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                                        <span className="text-xs text-gray-500 uppercase font-black block mb-2">User Agent</span>
                                                        <p className="text-[11px] text-gray-400 font-mono break-all line-clamp-2">
                                                            {users.find(u => u.id === showSecurityDossier)?.registrationUserAgent || 'No data'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sessions Section */}
                                            <div className="bg-neutral-800/40 p-4 rounded-xl border border-white/5 space-y-3">
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Session History</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {[
                                                        { ip: 'lastLoginIp1', ua: 'lastLoginUserAgent1', label: 'Main Session', color: 'text-green-500' },
                                                        { ip: 'lastLoginIp2', ua: 'lastLoginUserAgent2', label: 'Previous Session', color: 'text-gray-400' }
                                                    ].map((s, idx) => (
                                                        <div key={idx} className="bg-black/30 p-4 rounded-xl border border-white/5">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs text-gray-500 uppercase font-black">{s.label}</span>
                                                                <button
                                                                    onClick={async () => {
                                                                        const rawIp = (users.find(u => u.id === showSecurityDossier) as any)?.[s.ip] || '';
                                                                        const copyVal = rawIp.includes(',') ? rawIp.split(',')[2] : rawIp;
                                                                        await navigator.clipboard.writeText(copyVal);
                                                                        alert('IP Address Copied');
                                                                    }}
                                                                    className="text-gray-500 hover:text-white transition-colors"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <IPGeoInfo
                                                                ip={(users.find(u => u.id === showSecurityDossier) as any)?.[s.ip]}
                                                                colorClasses={s.color}
                                                            />
                                                            <p className="mt-2 text-[11px] text-gray-600 font-mono break-all line-clamp-1 border-t border-white/5 pt-1">
                                                                {(users.find(u => u.id === showSecurityDossier) as any)?.[s.ua] || 'No metadata'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-gray-500 font-black uppercase tracking-widestAlpha text-xs">Access Denied / No Data</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Badge Management Modal */}
                {
                    showBadgeModal && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-story-gold/20 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
                                <h3 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">
                                    {editingBadge ? 'Редактировать значок' : 'Создать новый значок'}
                                </h3>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const formData = new FormData(form);
                                    const data = {
                                        name: formData.get('name') as string,
                                        color: formData.get('color') as string,
                                        svgIcon: formData.get('svgIcon') as string,
                                        discordRoleId: formData.get('discordRoleId') as string
                                    };

                                    try {
                                        if (editingBadge) {
                                            await adminApi.updateBadge(editingBadge.id, data);
                                        } else {
                                            await adminApi.createBadge(data);
                                        }
                                        setShowBadgeModal(false);
                                        fetchSettingsAndBadges();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Ошибка при сохранении значка');
                                    }
                                }} className="space-y-4">
                                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Предпросмотр</span>
                                        <BadgePreview />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Название</label>
                                        <input
                                            name="name"
                                            value={badgeForm.name}
                                            onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Цвет (HEX)</label>
                                            <input
                                                name="color"
                                                value={badgeForm.color}
                                                onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Discord Role</label>
                                            <input
                                                name="discordRoleId"
                                                value={badgeForm.discordRoleId}
                                                onChange={(e) => setBadgeForm({ ...badgeForm, discordRoleId: e.target.value })}
                                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">SVG Icon (Raw Content)</label>
                                        <textarea
                                            name="svgIcon"
                                            value={badgeForm.svgIcon}
                                            onChange={(e) => setBadgeForm({ ...badgeForm, svgIcon: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-story-gold/50 outline-none font-mono text-[10px] h-32 resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <button type="submit" className="flex-1 bg-story-gold hover:bg-story-gold-light text-black font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">Сохранить</button>
                                        <button type="button" onClick={() => setShowBadgeModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs">Отмена</button>
                                    </div>
                                </form>
                            </div>
                        </div >
                    )
                }

                {/* Warnings Modal */}
                {
                    showWarningsModal && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative animate-fadeIn max-h-[90vh] flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Предупреждения</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widestAlpha">
                                                Пользователь: {(users.find(u => u.id === selectedUserId))?.username}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowWarningsModal(false)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                                    {/* Issue New Warning Form */}
                                    <div className="mb-8 p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex flex-col gap-4">
                                        <h4 className="text-xs font-black text-orange-300 uppercase tracking-widestAlpha flex items-center gap-2">
                                            <Send className="w-3.5 h-3.5" /> Выдать новое предупреждение
                                        </h4>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={newWarningReason}
                                                onChange={(e) => setNewWarningReason(e.target.value)}
                                                placeholder="Причина предупреждения..."
                                                className="flex-grow px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-orange-500/50 outline-none text-sm"
                                                onKeyDown={(e) => e.key === 'Enter' && handleIssueWarning()}
                                            />
                                            <button
                                                onClick={handleIssueWarning}
                                                disabled={isIssuingWarning || !newWarningReason.trim()}
                                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-black font-black rounded-xl transition-all uppercase tracking-widest text-[10px]"
                                            >
                                                {isIssuingWarning ? 'Выдача...' : 'Выдать'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* History List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widestAlpha flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 opacity-50" /> История
                                            </h4>
                                            <span className="text-xs text-gray-600 font-bold uppercase">{userWarnings.length} записи</span>
                                        </div>

                                        {userWarnings.length === 0 ? (
                                            <div className="py-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                                                <p className="text-xs text-gray-600 font-bold uppercase tracking-widestAlpha">История пуста</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {[...userWarnings].reverse().map((w) => (
                                                    <div key={w.id} className={`p-5 rounded-2xl border transition-all ${w.active ? 'bg-white/[0.03] border-white/5 shadow-xl' : 'bg-transparent border-white/[0.02] opacity-60'}`}>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widestAlpha border ${w.active ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                                                        {w.active ? 'Активно' : 'Отозвано'}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widestAlpha">
                                                                        ID: #{w.id}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white group-hover:text-story-gold transition-colors">{w.reason}</span>
                                                                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">от {w.issuedByUsername}</span>
                                                                </div>
                                                                <span className="text-[11px] text-gray-600 font-bold uppercase tracking-tighter shrink-0">
                                                                    {new Date(w.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {w.active && (
                                                                    <button
                                                                        onClick={() => handleRevokeWarning(w.id)}
                                                                        className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg border border-yellow-500/10 transition-colors"
                                                                        title="Отозвать"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => handleDeleteWarning(w.id)}
                                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/10 transition-colors"
                                                                        title="Удалить"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 bg-black/40 border-t border-white/5 flex justify-between items-center shrink-0">
                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widestAlpha max-w-xs leading-relaxed">
                                        Действуйте осторожно. Изменения применяются мгновенно.
                                    </p>
                                    <button
                                        onClick={() => { setShowEditUserModal(false); setShowWarningsModal(false); setShowBadgeModal(false); }}
                                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Season Reset Confirmation Modal */}
                {showResetSeasonModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <div className="bg-[#0c0c0c] border border-red-500/30 rounded-3xl w-full max-w-xl shadow-[0_0_100px_rgba(220,38,38,0.15)] relative overflow-hidden animate-fadeIn">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                        <Shield className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Критическое действие</h3>
                                        <p className="text-red-500/80 text-[10px] font-black uppercase tracking-[0.2em]">Сброс статусов сезона</p>
                                    </div>
                                    <button
                                        onClick={() => setShowResetSeasonModal(false)}
                                        className="ml-auto w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-8">
                                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-6 font-bold uppercase tracking-wide">
                                        Для подтверждения сброса сезона, введите текст ниже вручную (копирование запрещено):
                                    </p>
                                    <div className="bg-black/80 p-5 rounded-2xl border border-white/5 mb-8 text-center select-none pointer-events-none shadow-inner">
                                        <p className="text-red-500 font-black tracking-widest text-sm md:text-lg leading-relaxed select-none uppercase">
                                            STORYLEGENDS СИЛА!!! МИКОЛАЙЧИК МОГИЛА!!!! 22
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={confirmTypeText}
                                                onChange={(e) => setConfirmTypeText(e.target.value)}
                                                onPaste={(e) => e.preventDefault()}
                                                placeholder="Введите подтверждающий текст..."
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-gray-800 focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-700 uppercase tracking-widest group-focus-within:text-red-500/50 transition-colors">
                                                Manual Check
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={confirmTotpCode}
                                                onChange={(e) => setConfirmTotpCode(e.target.value.replace(/\D/g, ''))}
                                                maxLength={6}
                                                placeholder="ВВЕДИТЕ 6 ЦИФР КОДА 2FA"
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white text-center tracking-[0.4em] text-2xl placeholder:text-[10px] placeholder:tracking-[0.2em] placeholder:font-black placeholder:uppercase focus:outline-none focus:border-story-gold/50 focus:ring-4 focus:ring-story-gold/5 transition-all font-sans font-black"
                                            />
                                            <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-story-gold transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowResetSeasonModal(false)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black rounded-2xl border border-white/5 transition-all uppercase tracking-widestAlpha text-xs"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={submitResetSeason}
                                        disabled={confirmTypeText !== "STORYLEGENDS СИЛА!!! МИКОЛАЙЧИК МОГИЛА!!!! 22" || confirmTotpCode.length !== 6}
                                        className="flex-[1.5] py-5 bg-red-600 hover:bg-red-500 disabled:opacity-20 disabled:grayscale disabled:hover:bg-red-600 text-white font-black rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.2)] transition-all uppercase tracking-widest text-xs"
                                    >
                                        Подтвердить сброс
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </Layout >
    );
};

export default AdminDashboardPage;
