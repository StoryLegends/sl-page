import React, { useEffect, useState, useRef } from 'react';
import { 
    Play, Square, RotateCw, Zap, Terminal, Cpu, HardDrive, Users, Activity, 
    Upload, Package, Server, Send, RefreshCw, CheckCircle2, Settings as SettingsIcon,
    Folder, FileText, FileCode, Plus, ChevronRight, ArrowLeft, Trash2, X, Key, Globe
} from 'lucide-react';
import { 
    minecraftApi, 
    type MinecraftStatus, 
    type MinecraftPlayer, 
    type MinecraftServerInfo, 
    type ContainerFileItem 
} from '../../../api/minecraft';
import { useNotification } from '../../../context/NotificationContext';

const MinecraftServerTab: React.FC = () => {
    const { showNotification } = useNotification();
    
    // Server Selector State (Default: null = Grid / Tiles View)
    const [servers, setServers] = useState<MinecraftServerInfo[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
    const [status, setStatus] = useState<MinecraftStatus | null>(null);
    const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
    
    // New Server Form State
    const [newServerForm, setNewServerForm] = useState({
        name: '',
        version: '1.20.4',
        type: 'PAPER',
        memory: '4G',
        javaVersion: 'JAVA_21',
        cpuLimit: 100,
        swapMemory: '1024M',
        diskSpace: '25G',
        motd: '§6§lStoryLegends §7- §fMinecraft Server',
        onlineMode: false,
        maxPlayers: 50,
        autoRestart: 'always',
        port: 25565,
        rconPort: 25575,
        rconPassword: 'storylegends_rcon_pass'
    });

    const [activeSubTab, setActiveSubTab] = useState<'console' | 'files' | 'players' | 'settings'>('console');

    // Console / Terminal state
    const [logs, setLogs] = useState<string[]>([]);
    const [command, setCommand] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const terminalContainerRef = useRef<HTMLDivElement>(null);

    // Container File Manager state
    const [currentPath, setCurrentPath] = useState('');
    const [containerFiles, setContainerFiles] = useState<ContainerFileItem[]>([]);
    const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
    const [isSavingFile, setIsSavingFile] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // Players state
    const [players, setPlayers] = useState<MinecraftPlayer[]>([]);

    // Server & RCON Settings state
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        version: '1.20.4',
        type: 'PAPER',
        memory: '4G',
        javaVersion: 'JAVA_21',
        cpuLimit: 100,
        swapMemory: '1024M',
        diskSpace: '25G',
        motd: '§6§lStoryLegends §7- §fMinecraft Server',
        onlineMode: false,
        maxPlayers: 50,
        autoRestart: 'always',
        rconIp: '202.181.188.45',
        rconPort: 25826,
        rconPassword: 'SLdISRA2f8uu22qhyLOH17',
        rconEnabled: true
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const isOnline = status?.status === 'ONLINE';

    // Fetch servers list
    const fetchServers = async () => {
        try {
            const list = await minecraftApi.getServers();
            setServers(list);
        } catch (err) {}
    };

    // Refresh server status
    const fetchStatus = async () => {
        if (!selectedServerId) return;
        try {
            const data = await minecraftApi.getStatus(selectedServerId);
            setStatus(data);
        } catch (err) {}
    };

    // Refresh console logs
    const fetchLogs = async () => {
        if (!selectedServerId) return;
        try {
            const logLines = await minecraftApi.getLogs(selectedServerId);
            setLogs(logLines);
        } catch (err) {}
    };

    useEffect(() => {
        fetchServers();
    }, []);

    useEffect(() => {
        if (selectedServerId) {
            fetchStatus();
            fetchLogs();
            const interval = setInterval(() => {
                fetchStatus();
                if (activeSubTab === 'console') fetchLogs();
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [selectedServerId, activeSubTab]);

    // Update settings form when selected server changes
    useEffect(() => {
        if (!selectedServerId) return;
        const cur = servers.find(s => s.id === selectedServerId);
        if (cur) {
            setSettingsForm({
                name: cur.name,
                version: cur.version || '1.20.4',
                type: cur.type || 'PAPER',
                memory: cur.memory || '4G',
                javaVersion: cur.javaVersion || 'JAVA_21',
                cpuLimit: cur.cpuLimit || 100,
                swapMemory: cur.swapMemory || '1024M',
                diskSpace: cur.diskSpace || '25G',
                motd: cur.motd || '§6§lStoryLegends §7- §fMinecraft Server',
                onlineMode: cur.onlineMode ?? false,
                maxPlayers: cur.maxPlayers || 50,
                autoRestart: cur.autoRestart || 'always',
                rconIp: cur.rconIp || '202.181.188.45',
                rconPort: cur.rconPort || 25826,
                rconPassword: cur.rconPassword || 'SLdISRA2f8uu22qhyLOH17',
                rconEnabled: cur.rconEnabled ?? true
            });
        }
    }, [selectedServerId, servers]);

    // Auto-scroll terminal when autoScroll is enabled
    useEffect(() => {
        if (autoScroll && activeSubTab === 'console' && terminalEndRef.current && selectedServerId) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll, activeSubTab, selectedServerId]);

    // Load File Manager directory
    const loadFiles = async (path: string = currentPath) => {
        if (!selectedServerId) return;
        try {
            const files = await minecraftApi.listFiles(selectedServerId, path);
            setContainerFiles(files);
            setCurrentPath(path);
        } catch (err) {
            showNotification('Ошибка загрузки файлов контейнера', 'error');
        }
    };

    useEffect(() => {
        if (selectedServerId && activeSubTab === 'files' && !editingFile) {
            loadFiles(currentPath);
        } else if (selectedServerId && activeSubTab === 'players') {
            minecraftApi.getPlayers().then(setPlayers).catch(console.error);
        }
    }, [activeSubTab, selectedServerId, currentPath]);

    const handleCreateServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServerForm.name.trim()) {
            showNotification('Укажите название сервера', 'error');
            return;
        }
        try {
            const res = await minecraftApi.createServer(newServerForm);
            showNotification(res.message || 'Сервер создан!', 'success');
            setIsCreateServerModalOpen(false);
            const nextPort = 25565 + servers.length + 1;
            setNewServerForm({
                name: '',
                version: '1.20.4',
                type: 'PAPER',
                memory: '4G',
                javaVersion: 'JAVA_21',
                cpuLimit: 100,
                swapMemory: '1024M',
                diskSpace: '25G',
                motd: '§6§lStoryLegends §7- §fMinecraft Server',
                onlineMode: false,
                maxPlayers: 50,
                autoRestart: 'always',
                port: nextPort,
                rconPort: nextPort + 10,
                rconPassword: 'storylegends_rcon_pass'
            });
            await fetchServers();
            if (res.server && res.server.id) {
                setSelectedServerId(res.server.id);
            }
        } catch (err) {
            showNotification('Ошибка создания сервера.', 'error');
        }
    };

    const handleDeleteServer = async (serverId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Вы действительно хотите удалить этот сервер из панели?')) return;
        try {
            const res = await minecraftApi.deleteServer(serverId);
            showNotification(res.message || 'Сервер удален', 'info');
            if (selectedServerId === serverId) {
                setSelectedServerId(null);
            }
            await fetchServers();
        } catch (err) {
            showNotification('Ошибка при удалении сервера', 'error');
        }
    };

    const handleSaveServerSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServerId) return;
        setIsSavingSettings(true);
        try {
            const res = await minecraftApi.updateServerSettings({
                serverId: selectedServerId,
                ...settingsForm
            });
            showNotification(res.message || 'Настройки сервера и RCON сохранены!', 'success');
            await fetchServers();
            fetchStatus();
        } catch (err) {
            showNotification('Ошибка при сохранении настроек сервера.', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill', serverId: string = selectedServerId || 'server-1', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const res = await minecraftApi.powerAction(action, serverId);
            showNotification(res.message || 'Команда питания отправлена', 'success');
            fetchStatus();
        } catch (err) {
            showNotification('Ошибка выполнения действия питания.', 'error');
        }
    };

    const handleSendCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;
        const cmdToRun = command.trim();
        setCommand('');

        setLogs(prev => [...prev, `> ${cmdToRun}`]);

        try {
            const res = await minecraftApi.sendCommand(cmdToRun, selectedServerId || 'server-1');
            if (res.output) {
                setLogs(prev => [...prev, res.output]);
            }
        } catch (err) {
            showNotification('Ошибка отправки команды RCON', 'error');
        }
    };

    const handleOpenFile = async (filePath: string) => {
        if (!selectedServerId) return;
        try {
            const content = await minecraftApi.readFile(selectedServerId, filePath);
            setEditingFile({ path: filePath, content });
        } catch (err) {
            showNotification('Ошибка при чтении файла', 'error');
        }
    };

    const handleSaveEditingFile = async () => {
        if (!editingFile) return;
        setIsSavingFile(true);
        try {
            const res = await minecraftApi.writeFile(editingFile.path, editingFile.content);
            showNotification(res.message || 'Файл сохранен в контейнере!', 'success');
        } catch (err) {
            showNotification('Ошибка при сохранении файла', 'error');
        } finally {
            setIsSavingFile(false);
        }
    };

    const handleUploadToContainer = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        try {
            const res = await minecraftApi.uploadContainerFile(file, currentPath || 'plugins');
            showNotification(res.message || 'Файл загружен в контейнер!', 'success');
            loadFiles(currentPath);
        } catch (err) {
            showNotification('Ошибка загрузки файла в контейнер', 'error');
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleDeleteContainerFile = async (path: string) => {
        if (!window.confirm(`Удалить файл ${path} из контейнера?`)) return;
        try {
            const res = await minecraftApi.deleteContainerFile(path);
            showNotification(res.message || 'Файл удален', 'info');
            loadFiles(currentPath);
        } catch (err) {
            showNotification('Ошибка при удалении файла', 'error');
        }
    };

    const currentServer = servers.find(s => s.id === selectedServerId) || {
        id: 'server-1',
        name: 'Основной Сервер #1 (StoryLegends)',
        containerName: 'sl-minecraft-server',
        version: '1.20.4',
        type: 'PAPER',
        port: 25565,
        memory: '4G',
        javaVersion: 'JAVA_21',
        maxPlayers: 50,
        motd: '§6§lStoryLegends §7- §fLegendary Minecraft Experience'
    };

    return (
        <div className="space-y-6 w-full animate-fadeIn">
            {/* LEVEL 1: SERVERS GRID / TILES OVERVIEW (When no server selected) */}
            {!selectedServerId ? (
                <div className="space-y-6 w-full">
                    {/* Header Title Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[#091322] border border-white/10 shadow-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Server className="w-6 h-6 text-story-gold" />
                                Серверы Minecraft
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Управление всеми игровыми экземплярами, ядрами, Docker-контейнерами и портами</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsCreateServerModalOpen(true)}
                            className="px-5 py-2.5 bg-story-gold text-black hover:bg-story-gold-light font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Настроить новый сервер
                        </button>
                    </div>

                    {/* Empty State when zero servers configured */}
                    {servers.length === 0 ? (
                        <div className="p-16 border-2 border-dashed border-white/20 rounded-2xl bg-[#091322]/60 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-story-gold/10 border border-story-gold/30 flex items-center justify-center mx-auto">
                                <Plus className="w-8 h-8 text-story-gold" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Список серверов пуст</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                                    Нажмите кнопку ниже, чтобы создать и настроить ваш сервер Minecraft.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateServerModalOpen(true)}
                                className="px-6 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs shadow-md hover:bg-story-gold-light transition-all cursor-pointer inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Создать первый сервер
                            </button>
                        </div>
                    ) : (
                        /* Servers Grid (Tiles) */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {servers.map((srv) => (
                                <div 
                                    key={srv.id}
                                    onClick={() => setSelectedServerId(srv.id)}
                                    className="p-6 rounded-2xl bg-[#091322] border border-white/10 hover:border-story-gold/50 shadow-2xl transition-all hover:scale-[1.01] cursor-pointer space-y-5 flex flex-col justify-between group"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span className="text-[10px] font-bold tracking-widest text-story-gold uppercase font-mono">{srv.type} {srv.version}</span>
                                                <h3 className="text-base font-bold text-white group-hover:text-story-gold transition-colors">{srv.name}</h3>
                                                <p className="text-xs font-mono text-gray-400">Порт: :{srv.port} • RAM: {srv.memory}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                                    АКТИВЕН
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteServer(srv.id, e)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Удалить сервер"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mini Metrics Meters */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                                                <div className="text-gray-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU</div>
                                                <div className="text-white font-bold">0.0%</div>
                                            </div>

                                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                                                <div className="text-gray-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-purple-400" /> RAM</div>
                                                <div className="text-white font-bold">0.0 / {srv.memory}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Server Footer Actions */}
                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => handlePowerAction('start', srv.id, e)}
                                                className="p-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                                title="Запустить"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handlePowerAction('restart', srv.id, e)}
                                                className="p-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                                title="Перезапустить"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handlePowerAction('stop', srv.id, e)}
                                                className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                                title="Остановить"
                                            >
                                                <Square className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => setSelectedServerId(srv.id)}
                                            className="px-4 py-2 bg-white/10 hover:bg-story-gold text-white hover:text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            Управление <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Server Card Tile */}
                            <div 
                                onClick={() => setIsCreateServerModalOpen(true)}
                                className="p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-story-gold/60 bg-[#091322]/40 hover:bg-[#091322] transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 min-h-[220px] group"
                            >
                                <div className="w-12 h-12 rounded-full bg-story-gold/10 border border-story-gold/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-story-gold" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Добавить новый сервер</h4>
                                    <p className="text-xs text-gray-400">Paper, Purpur, Fabric, Forge</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* LEVEL 2: DETAILED SERVER MANAGEMENT DASHBOARD (Console, Files, Players, Extended Settings) */
                <div className="space-y-6 w-full">
                    {/* Top Navigation Bar back to Servers List */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setSelectedServerId(null)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> ← К списку серверов
                        </button>

                        <span className="text-xs font-mono text-gray-400">
                            ID Сервера: <code className="text-story-gold">{currentServer?.id}</code>
                        </span>
                    </div>

                    {/* SERVER SELECTOR & DOCKER HEADER */}
                    <div className="p-6 rounded-2xl bg-[#091322] border border-white/10 shadow-2xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-story-gold/10 border border-story-gold/30 flex items-center justify-center shrink-0">
                                    <Server className="w-6 h-6 text-story-gold" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-white">{currentServer?.name}</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                                            isOnline 
                                                ? 'bg-green-600 text-white border-green-500' 
                                                : 'bg-red-600 text-white border-red-500'
                                        }`}>
                                            {isOnline ? 'ОНЛАЙН' : 'ВЫКЛЮЧЕН'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Контейнер: <code className="text-story-gold font-mono">{currentServer?.containerName}</code> • Ядро: {currentServer?.type} {currentServer?.version} • Порт: {currentServer?.port}
                                    </p>
                                </div>
                            </div>

                            {/* Server Power Control Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePowerAction('start')}
                                    disabled={isOnline}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5" /> Запустить
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handlePowerAction('restart')}
                                    disabled={!isOnline}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCw className="w-3.5 h-3.5" /> Перезапустить
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handlePowerAction('stop')}
                                    disabled={!isOnline}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Square className="w-3.5 h-3.5" /> Остановить
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handlePowerAction('kill')}
                                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="Принудительно выключить контейнер"
                                >
                                    <Zap className="w-3.5 h-3.5" /> Выключить
                                </button>
                            </div>
                        </div>

                        {/* METRICS METERS BAR */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="flex items-center gap-1.5 font-bold"><Cpu className="w-4 h-4 text-blue-400" /> CPU Нагрузка</span>
                                    <span className="font-mono text-white font-bold">{status?.cpuUsagePercent?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(status?.cpuUsagePercent || 0, 100)}%` }} />
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="flex items-center gap-1.5 font-bold"><HardDrive className="w-4 h-4 text-purple-400" /> RAM Память</span>
                                    <span className="font-mono text-white font-bold">{((status?.memoryUsedMb || 0) / 1024).toFixed(2)} / {currentServer?.memory || '4G'}</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(((status?.memoryUsedMb || 0) / 4096) * 100, 100)}%` }} />
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="flex items-center gap-1.5 font-bold"><Activity className="w-4 h-4 text-green-400" /> TPS (Скорость)</span>
                                    <span className="font-mono text-green-400 font-bold">{status?.tps?.toFixed(1) || '0.0'} TPS</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${((status?.tps || 0) / 20.0) * 100}%` }} />
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-gray-400">
                                    <span className="flex items-center gap-1.5 font-bold"><Users className="w-4 h-4 text-story-gold" /> Игроков Онлайн</span>
                                    <span className="font-mono text-story-gold font-bold">{status?.onlinePlayers || 0} / {currentServer?.maxPlayers || 50}</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-story-gold transition-all duration-500" style={{ width: `${Math.min(((status?.onlinePlayers || 0) / (currentServer?.maxPlayers || 50)) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SUB-TABS NAVIGATION */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => { setActiveSubTab('console'); setEditingFile(null); }}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubTab === 'console' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            <Terminal className="w-4 h-4" /> Консоль и Терминал
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveSubTab('files'); setEditingFile(null); }}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubTab === 'files' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            <Folder className="w-4 h-4" /> Файловый менеджер контейнера
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveSubTab('players'); setEditingFile(null); }}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubTab === 'players' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            <Users className="w-4 h-4" /> Игроки Онлайн
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveSubTab('settings'); setEditingFile(null); }}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                                activeSubTab === 'settings' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            <SettingsIcon className="w-4 h-4" /> Конфигурация & RCON
                        </button>
                    </div>

                    {/* SUB-TAB 1: LIVE CONSOLE & TERMINAL */}
                    {activeSubTab === 'console' && (
                        <div className="bg-[#050b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                                <span className="font-mono text-gray-400 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-story-gold" />
                                    Live RCON Console Stream ({currentServer?.name})
                                </span>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoScroll}
                                            onChange={e => setAutoScroll(e.target.checked)}
                                            className="rounded bg-black/50 border-white/20 text-story-gold focus:ring-0"
                                        />
                                        Авто-скролл
                                    </label>
                                    <button
                                        type="button"
                                        onClick={fetchLogs}
                                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Обновить
                                    </button>
                                </div>
                            </div>

                            <div 
                                ref={terminalContainerRef}
                                className="bg-black/90 p-4 rounded-xl font-mono text-xs text-green-400 h-[450px] overflow-y-auto space-y-1.5 border border-white/10 shadow-inner select-text"
                            >
                                {logs.map((line, idx) => (
                                    <div key={idx} className="leading-relaxed break-all font-mono">
                                        <span className="text-gray-500 mr-2">[{idx + 1}]</span>
                                        <span className={
                                            line.includes('ERROR') || line.includes('WARN') ? 'text-red-400 font-bold' :
                                            line.includes('>') ? 'text-yellow-300 font-bold' :
                                            line.includes('joined') || line.includes('left') ? 'text-blue-300' : 'text-gray-200'
                                        }>
                                            {line}
                                        </span>
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>

                            <form onSubmit={handleSendCommand} className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3.5 top-3 text-story-gold font-mono font-bold text-sm">&gt;</span>
                                    <input
                                        type="text"
                                        value={command}
                                        onChange={e => setCommand(e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-story-gold/60"
                                        placeholder="Введите RCON команду (например: op nickname, whitelist add name, say Hello!)..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
                                >
                                    <Send className="w-4 h-4" /> Отправить
                                </button>
                            </form>
                        </div>
                    )}

                    {/* SUB-TAB 2: CONTAINER FILE MANAGER & MULTI-FILE CODE EDITOR */}
                    {activeSubTab === 'files' && (
                        <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                            {editingFile ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditingFile(null)}
                                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                                                title="Назад к файлам"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <div>
                                                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                                                    <FileCode className="w-4 h-4 text-story-gold" />
                                                    {editingFile.path}
                                                </h3>
                                                <p className="text-xs text-gray-400">Редактирование файла в контейнере Minecraft</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSaveEditingFile}
                                                disabled={isSavingFile}
                                                className="px-5 py-2 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all flex items-center gap-2 shadow-md cursor-pointer"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {isSavingFile ? 'Сохранение...' : 'Сохранить файл'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingFile(null)}
                                                className="p-2 text-gray-400 hover:text-white cursor-pointer"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        value={editingFile.content}
                                        onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
                                        className="w-full bg-black/90 border border-white/15 rounded-xl p-4 text-green-400 font-mono text-xs leading-relaxed h-[520px] focus:outline-none focus:border-story-gold/60 select-text"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => loadFiles('')}
                                                className="hover:text-story-gold font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                /data
                                            </button>
                                            {currentPath.split('/').filter(Boolean).map((part, i, arr) => {
                                                const subPath = arr.slice(0, i + 1).join('/');
                                                return (
                                                    <React.Fragment key={subPath}>
                                                        <ChevronRight className="w-3 h-3 text-gray-500" />
                                                        <button
                                                            type="button"
                                                            onClick={() => loadFiles(subPath)}
                                                            className="hover:text-story-gold font-bold cursor-pointer"
                                                        >
                                                            {part}
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className={`px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 ${isUploadingFile ? 'opacity-50' : ''}`}>
                                                <Upload className="w-4 h-4" />
                                                {isUploadingFile ? 'Загрузка...' : 'Загрузить файл в контейнер'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleUploadToContainer}
                                                    disabled={isUploadingFile}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden text-xs">
                                        <div className="grid grid-cols-12 px-4 py-2.5 bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                                            <div className="col-span-6">ИМЯ ФАЙЛА / ПАПКИ</div>
                                            <div className="col-span-3">РАЗМЕР</div>
                                            <div className="col-span-3 text-right">ДЕЙСТВИЯ</div>
                                        </div>

                                        {containerFiles.map((fileItem, idx) => (
                                            <div key={idx} className="grid grid-cols-12 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all items-center text-gray-200">
                                                <div className="col-span-6 flex items-center gap-2.5">
                                                    {fileItem.isDir ? (
                                                        <Folder className="w-4 h-4 text-story-gold shrink-0" />
                                                    ) : fileItem.name.endsWith('.jar') ? (
                                                        <Package className="w-4 h-4 text-purple-400 shrink-0" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                                    )}

                                                    {fileItem.isDir ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => loadFiles(fileItem.relativePath)}
                                                            className="font-bold hover:text-story-gold text-left truncate cursor-pointer"
                                                        >
                                                            {fileItem.name}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenFile(fileItem.relativePath)}
                                                            className="hover:text-blue-300 font-mono text-left truncate cursor-pointer"
                                                        >
                                                            {fileItem.name}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="col-span-3 font-mono text-gray-400">
                                                    {fileItem.isDir ? '—' : `${(fileItem.sizeBytes / 1024).toFixed(1)} KB`}
                                                </div>

                                                <div className="col-span-3 flex items-center justify-end gap-2">
                                                    {!fileItem.isDir && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenFile(fileItem.relativePath)}
                                                            className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg font-bold text-[11px] cursor-pointer"
                                                        >
                                                            Редактировать
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteContainerFile(fileItem.relativePath)}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                                        title="Удалить файл"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUB-TAB 3: PLAYERS ONLINE */}
                    {activeSubTab === 'players' && (
                        <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-story-gold" />
                                    Игроки на сервере ({currentServer?.name})
                                </h3>
                            </div>

                            {players.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 space-y-2">
                                    <Users className="w-12 h-12 mx-auto text-gray-600" />
                                    <p>На сервере сейчас нет онлайн игроков.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {players.map((player, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-xl bg-black/40" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">{player.name}</h4>
                                                    <span className="text-xs text-green-400 font-mono">{player.ping} ms</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await minecraftApi.sendCommand(`op ${player.name}`);
                                                        showNotification(`Выданы права OP игроку ${player.name}`, 'success');
                                                    }}
                                                    className="px-2.5 py-1 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 rounded-lg text-xs font-bold border border-yellow-500/30 cursor-pointer"
                                                >
                                                    OP
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await minecraftApi.sendCommand(`kick ${player.name}`);
                                                        showNotification(`Игрок ${player.name} кикнут`, 'info');
                                                        const updated = await minecraftApi.getPlayers();
                                                        setPlayers(updated);
                                                    }}
                                                    className="px-2.5 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-xs font-bold border border-red-500/30 cursor-pointer"
                                                >
                                                    Кик
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUB-TAB 4: ENGINE, LIMITS & RCON CONFIGURATION */}
                    {activeSubTab === 'settings' && (
                        <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <SettingsIcon className="w-5 h-5 text-story-gold" />
                                        Полная конфигурация сервера & RCON
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">Лимиты ресурсов (RAM, CPU, Swap, Disk), версия Java, MOTD и параметры RCON</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveServerSettings}
                                    disabled={isSavingSettings}
                                    className="px-5 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all shadow-md flex items-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {isSavingSettings ? 'Сохранение...' : 'Сохранить настройки'}
                                </button>
                            </div>

                            <form onSubmit={handleSaveServerSettings} className="space-y-6 text-xs">
                                {/* Section 1: Main Server Identity & Engine */}
                                <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h4 className="text-sm font-bold text-story-gold flex items-center gap-2">
                                        <Server className="w-4 h-4" /> Ядро и Версия Minecraft
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Название сервера</label>
                                            <input
                                                type="text"
                                                value={settingsForm.name}
                                                onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-story-gold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Ядро / Движок</label>
                                            <select
                                                value={settingsForm.type}
                                                onChange={e => setSettingsForm({ ...settingsForm, type: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-story-gold font-bold"
                                            >
                                                <option value="PAPER">Paper (Рекомендуется)</option>
                                                <option value="PURPUR">Purpur (High Performance)</option>
                                                <option value="FABRIC">Fabric (Modded)</option>
                                                <option value="FORGE">Forge (Modded)</option>
                                                <option value="SPIGOT">Spigot</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Версия Minecraft</label>
                                            <select
                                                value={settingsForm.version}
                                                onChange={e => setSettingsForm({ ...settingsForm, version: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-story-gold font-bold"
                                            >
                                                <option value="1.20.4">1.20.4 (Актуальная)</option>
                                                <option value="1.20.2">1.20.2</option>
                                                <option value="1.19.4">1.19.4</option>
                                                <option value="1.16.5">1.16.5 (Классическая)</option>
                                                <option value="1.12.2">1.12.2</option>
                                                <option value="1.8.8">1.8.8 (PvP)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Resource Limits & Java Container Settings */}
                                <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h4 className="text-sm font-bold text-story-gold flex items-center gap-2">
                                        <Cpu className="w-4 h-4" /> Лимиты ресурсов и Java Runtime
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Версия Java Runtime</label>
                                            <select
                                                value={settingsForm.javaVersion}
                                                onChange={e => setSettingsForm({ ...settingsForm, javaVersion: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                            >
                                                <option value="JAVA_21">Java 21 LTS (LATEST)</option>
                                                <option value="JAVA_17">Java 17 LTS</option>
                                                <option value="JAVA_11">Java 11</option>
                                                <option value="JAVA_8">Java 8 (Legacy 1.12/1.8)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Выделение RAM Памяти</label>
                                            <select
                                                value={settingsForm.memory}
                                                onChange={e => setSettingsForm({ ...settingsForm, memory: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                            >
                                                <option value="2G">2 GB RAM</option>
                                                <option value="4G">4 GB RAM</option>
                                                <option value="8G">8 GB RAM</option>
                                                <option value="16G">16 GB RAM</option>
                                                <option value="32G">32 GB RAM</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Лимит CPU (%)</label>
                                            <input
                                                type="number"
                                                value={settingsForm.cpuLimit}
                                                onChange={e => setSettingsForm({ ...settingsForm, cpuLimit: parseInt(e.target.value) || 100 })}
                                                placeholder="100"
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Память Swap (MB)</label>
                                            <input
                                                type="text"
                                                value={settingsForm.swapMemory}
                                                onChange={e => setSettingsForm({ ...settingsForm, swapMemory: e.target.value })}
                                                placeholder="1024M"
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Server Configuration & MOTD */}
                                <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h4 className="text-sm font-bold text-story-gold flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> MOTD, Лимит игроков и режим авторизации
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-gray-300 font-bold mb-1">MOTD Описание сервера</label>
                                            <input
                                                type="text"
                                                value={settingsForm.motd}
                                                onChange={e => setSettingsForm({ ...settingsForm, motd: e.target.value })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">Макс. Игроков (Слоты)</label>
                                            <input
                                                type="number"
                                                value={settingsForm.maxPlayers}
                                                onChange={e => setSettingsForm({ ...settingsForm, maxPlayers: parseInt(e.target.value) || 50 })}
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer font-bold">
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.onlineMode}
                                                onChange={e => setSettingsForm({ ...settingsForm, onlineMode: e.target.checked })}
                                                className="rounded bg-black/50 border-white/20 text-story-gold focus:ring-0"
                                            />
                                            Online Mode (Проверка лицензии Mojang)
                                        </label>

                                        <div className="flex items-center gap-3">
                                            <label className="text-gray-300 font-bold">Авто-перезапуск при сбое:</label>
                                            <select
                                                value={settingsForm.autoRestart}
                                                onChange={e => setSettingsForm({ ...settingsForm, autoRestart: e.target.value })}
                                                className="bg-black/50 border border-white/15 rounded-xl p-2 text-white font-mono text-xs focus:outline-none"
                                            >
                                                <option value="always">Всегда (Always)</option>
                                                <option value="on-failure">При сбое (On Failure)</option>
                                                <option value="unless-stopped">Пока не остановлен вручную</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: RCON Connection Parameters */}
                                <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-story-gold flex items-center gap-2">
                                            <Key className="w-4 h-4" /> Настройки RCON подключения
                                        </h4>
                                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer font-bold">
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.rconEnabled}
                                                onChange={e => setSettingsForm({ ...settingsForm, rconEnabled: e.target.checked })}
                                                className="rounded bg-black/50 border-white/20 text-story-gold focus:ring-0"
                                            />
                                            RCON Включен
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">RCON IP / Хост</label>
                                            <input
                                                type="text"
                                                value={settingsForm.rconIp}
                                                onChange={e => setSettingsForm({ ...settingsForm, rconIp: e.target.value })}
                                                placeholder="202.181.188.45"
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">RCON Порт</label>
                                            <input
                                                type="number"
                                                value={settingsForm.rconPort}
                                                onChange={e => setSettingsForm({ ...settingsForm, rconPort: parseInt(e.target.value) || 25826 })}
                                                placeholder="25826"
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1">RCON Пароль</label>
                                            <input
                                                type="password"
                                                value={settingsForm.rconPassword}
                                                onChange={e => setSettingsForm({ ...settingsForm, rconPassword: e.target.value })}
                                                placeholder="Пароль RCON..."
                                                className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE NEW SERVER MODAL (ALWAYS RENDERED OUTSIDE CONDITIONAL BRANCHES) */}
            {isCreateServerModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#091322] border border-story-gold/40 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative z-[10000]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-story-gold" />
                                Настройка нового сервера Minecraft
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setIsCreateServerModalOpen(false)} 
                                className="text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateServer} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Название сервера *</label>
                                <input
                                    type="text"
                                    value={newServerForm.name}
                                    onChange={e => setNewServerForm({ ...newServerForm, name: e.target.value })}
                                    placeholder="например: Анархия #1 1.16.5"
                                    className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-story-gold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Ядро / Движок</label>
                                    <select
                                        value={newServerForm.type}
                                        onChange={e => setNewServerForm({ ...newServerForm, type: e.target.value })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                    >
                                        <option value="PAPER">Paper (Рекомендуется)</option>
                                        <option value="PURPUR">Purpur (High Performance)</option>
                                        <option value="FABRIC">Fabric (Modded)</option>
                                        <option value="FORGE">Forge (Modded)</option>
                                        <option value="SPIGOT">Spigot</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Версия Minecraft</label>
                                    <select
                                        value={newServerForm.version}
                                        onChange={e => setNewServerForm({ ...newServerForm, version: e.target.value })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                    >
                                        <option value="1.20.4">1.20.4</option>
                                        <option value="1.20.2">1.20.2</option>
                                        <option value="1.19.4">1.19.4</option>
                                        <option value="1.16.5">1.16.5</option>
                                        <option value="1.12.2">1.12.2</option>
                                        <option value="1.8.8">1.8.8</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Выделяемая RAM Память</label>
                                    <select
                                        value={newServerForm.memory}
                                        onChange={e => setNewServerForm({ ...newServerForm, memory: e.target.value })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                    >
                                        <option value="2G">2 GB RAM</option>
                                        <option value="4G">4 GB RAM</option>
                                        <option value="8G">8 GB RAM</option>
                                        <option value="16G">16 GB RAM</option>
                                        <option value="32G">32 GB RAM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Версия Java</label>
                                    <select
                                        value={newServerForm.javaVersion}
                                        onChange={e => setNewServerForm({ ...newServerForm, javaVersion: e.target.value })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white focus:outline-none font-bold"
                                    >
                                        <option value="JAVA_21">Java 21 LTS</option>
                                        <option value="JAVA_17">Java 17 LTS</option>
                                        <option value="JAVA_11">Java 11</option>
                                        <option value="JAVA_8">Java 8</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Игровой порт сервера</label>
                                    <input
                                        type="number"
                                        value={newServerForm.port}
                                        onChange={e => setNewServerForm({ ...newServerForm, port: parseInt(e.target.value) || 25565 })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">RCON Порт</label>
                                    <input
                                        type="number"
                                        value={newServerForm.rconPort}
                                        onChange={e => setNewServerForm({ ...newServerForm, rconPort: parseInt(e.target.value) || 25575 })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">MOTD Описание</label>
                                <input
                                    type="text"
                                    value={newServerForm.motd}
                                    onChange={e => setNewServerForm({ ...newServerForm, motd: e.target.value })}
                                    className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateServerModalOpen(false)}
                                    className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl font-bold hover:bg-white/20 cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-story-gold text-black rounded-xl font-bold hover:bg-story-gold-light shadow-md cursor-pointer"
                                >
                                    Создать сервер
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinecraftServerTab;