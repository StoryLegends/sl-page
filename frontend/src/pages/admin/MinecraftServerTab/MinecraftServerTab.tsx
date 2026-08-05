import React, { useEffect, useState, useRef } from 'react';
import { 
    Play, Square, RotateCw, Zap, Terminal, Cpu, HardDrive, Users, Activity, 
    Upload, Package, Server, Send, RefreshCw, CheckCircle2, Settings as SettingsIcon,
    Folder, FileText, FileCode, Plus, ChevronRight, ArrowLeft, Trash2, X, Key
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
    
    // Server Selector State
    const [servers, setServers] = useState<MinecraftServerInfo[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<string>('server-1');
    const [status, setStatus] = useState<MinecraftStatus | null>(null);
    const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
    const [newServerForm, setNewServerForm] = useState({
        name: '',
        version: '1.20.4',
        type: 'PAPER',
        memory: '4G',
        port: 25566,
        rconPort: 25576,
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
            if (list.length > 0 && !selectedServerId) {
                setSelectedServerId(list[0].id);
            }
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
        fetchStatus();
        fetchLogs();
        const interval = setInterval(() => {
            fetchStatus();
            if (activeSubTab === 'console') fetchLogs();
        }, 4000);
        return () => clearInterval(interval);
    }, [selectedServerId, activeSubTab]);

    // Update settings form when selected server changes
    useEffect(() => {
        const cur = servers.find(s => s.id === selectedServerId);
        if (cur) {
            setSettingsForm({
                name: cur.name,
                version: cur.version || '1.20.4',
                type: cur.type || 'PAPER',
                memory: cur.memory || '4G',
                rconIp: cur.rconIp || '202.181.188.45',
                rconPort: cur.rconPort || 25826,
                rconPassword: cur.rconPassword || 'SLdISRA2f8uu22qhyLOH17',
                rconEnabled: cur.rconEnabled ?? true
            });
        }
    }, [selectedServerId, servers]);

    // Auto-scroll terminal when autoScroll is enabled
    useEffect(() => {
        if (autoScroll && activeSubTab === 'console' && terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll, activeSubTab]);

    // Load File Manager directory
    const loadFiles = async (path: string = currentPath) => {
        try {
            const files = await minecraftApi.listFiles(selectedServerId, path);
            setContainerFiles(files);
            setCurrentPath(path);
        } catch (err) {
            showNotification('Ошибка загрузки файлов контейнера', 'error');
        }
    };

    useEffect(() => {
        if (activeSubTab === 'files' && !editingFile && selectedServerId) {
            loadFiles(currentPath);
        } else if (activeSubTab === 'players' && selectedServerId) {
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
            setNewServerForm({
                name: '',
                version: '1.20.4',
                type: 'PAPER',
                memory: '4G',
                port: 25565 + servers.length + 1,
                rconPort: 25575 + servers.length + 1,
                rconPassword: 'storylegends_rcon_pass'
            });
            await fetchServers();
        } catch (err) {
            showNotification('Ошибка создания сервера.', 'error');
        }
    };

    const handleSaveServerSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await minecraftApi.updateServerSettings({
                serverId: selectedServerId,
                ...settingsForm
            });
            showNotification(res.message || 'Настройки сервера и RCON обновлены!', 'success');
            await fetchServers();
            fetchStatus();
        } catch (err) {
            showNotification('Ошибка при сохранении настроек сервера.', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        try {
            const res = await minecraftApi.powerAction(action, selectedServerId);
            showNotification(res.message || 'Команда отправлена', 'success');
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
            const res = await minecraftApi.sendCommand(cmdToRun);
            if (res.output) {
                setLogs(prev => [...prev, res.output]);
            }
        } catch (err) {
            showNotification('Ошибка отправки команды RCON', 'error');
        }
    };

    const handleOpenFile = async (filePath: string) => {
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

    const currentServer = servers.find(s => s.id === selectedServerId) || servers[0];

    return (
        <div className="space-y-6 w-full animate-fadeIn">
            {/* SERVER SELECTOR & DOCKER HEADER */}
            <div className="p-6 rounded-2xl bg-[#091322] border border-white/10 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-story-gold/10 border border-story-gold/30 flex items-center justify-center shrink-0">
                            <Server className="w-6 h-6 text-story-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                {servers.length > 0 ? (
                                    <select
                                        value={selectedServerId}
                                        onChange={e => setSelectedServerId(e.target.value)}
                                        className="bg-black/60 border border-story-gold/40 text-white font-bold text-base px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
                                    >
                                        {servers.map(s => (
                                            <option key={s.id} value={s.id} className="bg-[#091322] text-white">
                                                {s.name} ({s.type} {s.version}:{s.port})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-white font-bold text-base">Нет активных серверов</span>
                                )}

                                <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                                    isOnline 
                                        ? 'bg-green-600 text-white border-green-500' 
                                        : 'bg-red-600 text-white border-red-500'
                                }`}>
                                    {isOnline ? 'ОНЛАЙН' : 'ВЫКЛЮЧЕН'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Контейнер: <code className="text-story-gold font-mono">{currentServer?.containerName || 'sl-minecraft-server'}</code> • Версия: {currentServer?.type || 'PAPER'} {currentServer?.version || '1.20.4'} • Порт: {currentServer?.port || 25565}
                            </p>
                        </div>
                    </div>

                    {/* Server Actions & Power Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateServerModalOpen(true)}
                            className="px-3.5 py-2 bg-story-gold/20 hover:bg-story-gold/30 text-story-gold border border-story-gold/40 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 mr-2"
                        >
                            <Plus className="w-4 h-4" /> Новый сервер
                        </button>

                        <button
                            onClick={() => handlePowerAction('start')}
                            disabled={isOnline || !selectedServerId}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                            <Play className="w-3.5 h-3.5" /> Запустить
                        </button>

                        <button
                            onClick={() => handlePowerAction('restart')}
                            disabled={!isOnline || !selectedServerId}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                            <RotateCw className="w-3.5 h-3.5" /> Перезапустить
                        </button>

                        <button
                            onClick={() => handlePowerAction('stop')}
                            disabled={!isOnline || !selectedServerId}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                            <Square className="w-3.5 h-3.5" /> Остановить
                        </button>

                        <button
                            onClick={() => handlePowerAction('kill')}
                            disabled={!selectedServerId}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
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
                            <span className="font-mono text-white font-bold">{((status?.memoryUsedMb || 0) / 1024).toFixed(2)} / {((status?.memoryMaxMb || 4096) / 1024).toFixed(1)} GB</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(((status?.memoryUsedMb || 0) / (status?.memoryMaxMb || 4096)) * 100, 100)}%` }} />
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
                            <span className="font-mono text-story-gold font-bold">{status?.onlinePlayers || 0} / {status?.maxPlayers || 50}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-story-gold transition-all duration-500" style={{ width: `${Math.min(((status?.onlinePlayers || 0) / (status?.maxPlayers || 50)) * 100, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* PTERODACTYL SUB-TABS NAVIGATION */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold">
                <button
                    onClick={() => { setActiveSubTab('console'); setEditingFile(null); }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'console' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Terminal className="w-4 h-4" /> Консоль и Терминал
                </button>

                <button
                    onClick={() => { setActiveSubTab('files'); setEditingFile(null); }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'files' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Folder className="w-4 h-4" /> Файловый менеджер контейнера
                </button>

                <button
                    onClick={() => { setActiveSubTab('players'); setEditingFile(null); }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'players' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Users className="w-4 h-4" /> Игроки Онлайн
                </button>

                <button
                    onClick={() => { setActiveSubTab('settings'); setEditingFile(null); }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'settings' ? 'bg-story-gold text-black shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <SettingsIcon className="w-4 h-4" /> Настройки сервера и RCON
                </button>
            </div>

            {/* SUB-TAB 1: LIVE CONSOLE & TERMINAL */}
            {activeSubTab === 'console' && (
                <div className="bg-[#050b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                        <span className="font-mono text-gray-400 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-story-gold" />
                            Live RCON Console Stream ({currentServer?.name || 'Не выбран'})
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
                                onClick={fetchLogs}
                                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 font-mono text-[11px]"
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
                            className="px-6 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all flex items-center gap-2 shrink-0 shadow-md"
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
                                        onClick={() => setEditingFile(null)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
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
                                        onClick={handleSaveEditingFile}
                                        disabled={isSavingFile}
                                        className="px-5 py-2 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all flex items-center gap-2 shadow-md"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isSavingFile ? 'Сохранение...' : 'Сохранить файл'}
                                    </button>
                                    <button
                                        onClick={() => setEditingFile(null)}
                                        className="p-2 text-gray-400 hover:text-white"
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
                                        onClick={() => loadFiles('')}
                                        className="hover:text-story-gold font-bold flex items-center gap-1"
                                    >
                                        /data
                                    </button>
                                    {currentPath.split('/').filter(Boolean).map((part, i, arr) => {
                                        const subPath = arr.slice(0, i + 1).join('/');
                                        return (
                                            <React.Fragment key={subPath}>
                                                <ChevronRight className="w-3 h-3 text-gray-500" />
                                                <button
                                                    onClick={() => loadFiles(subPath)}
                                                    className="hover:text-story-gold font-bold"
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
                                                    onClick={() => loadFiles(fileItem.relativePath)}
                                                    className="font-bold hover:text-story-gold text-left truncate"
                                                >
                                                    {fileItem.name}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenFile(fileItem.relativePath)}
                                                    className="hover:text-blue-300 font-mono text-left truncate"
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
                                                    onClick={() => handleOpenFile(fileItem.relativePath)}
                                                    className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg font-bold text-[11px]"
                                                >
                                                    Редактировать
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteContainerFile(fileItem.relativePath)}
                                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
                            Игроки на сервере ({currentServer?.name || 'Не выбран'})
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
                                            onClick={async () => {
                                                await minecraftApi.sendCommand(`op ${player.name}`);
                                                showNotification(`Выданы права OP игроку ${player.name}`, 'success');
                                            }}
                                            className="px-2.5 py-1 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 rounded-lg text-xs font-bold border border-yellow-500/30"
                                        >
                                            OP
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await minecraftApi.sendCommand(`kick ${player.name}`);
                                                showNotification(`Игрок ${player.name} кикнут`, 'info');
                                                const updated = await minecraftApi.getPlayers();
                                                setPlayers(updated);
                                            }}
                                            className="px-2.5 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-xs font-bold border border-red-500/30"
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

            {/* SUB-TAB 4: DYNAMIC ENGINE, VERSION & RCON SETTINGS */}
            {activeSubTab === 'settings' && (
                <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-story-gold" />
                                Конфигурация ядра, версии Minecraft и RCON
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Изменение версии игры, движка и параметров подключения к RCON без правки файлов</p>
                        </div>

                        <button
                            onClick={handleSaveServerSettings}
                            disabled={isSavingSettings}
                            className="px-5 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all shadow-md flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSavingSettings ? 'Сохранение...' : 'Сохранить настройки и RCON'}
                        </button>
                    </div>

                    <form onSubmit={handleSaveServerSettings} className="space-y-6 text-xs">
                        {/* Section 1: Server Engine & Version */}
                        <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-story-gold flex items-center gap-2">
                                <Server className="w-4 h-4" /> Движок и Версия Minecraft
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

                        {/* Section 2: RCON Connection Parameters */}
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

            {/* CREATE NEW SERVER MODAL WITH EXTENDED FIELDS */}
            {isCreateServerModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#091322] border border-story-gold/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-story-gold" />
                                Создание нового Minecraft сервера
                            </h3>
                            <button onClick={() => setIsCreateServerModalOpen(false)} className="text-gray-400 hover:text-white">
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
                                    placeholder="например: Ивент / Анархия 1.16.5"
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
                                    <label className="block text-gray-300 font-bold mb-1">Игровой порт сервера</label>
                                    <input
                                        type="number"
                                        value={newServerForm.port}
                                        onChange={e => setNewServerForm({ ...newServerForm, port: parseInt(e.target.value) || 25565 })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                    />
                                </div>

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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">RCON Порт</label>
                                    <input
                                        type="number"
                                        value={newServerForm.rconPort}
                                        onChange={e => setNewServerForm({ ...newServerForm, rconPort: parseInt(e.target.value) || 25575 })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">RCON Пароль</label>
                                    <input
                                        type="password"
                                        value={newServerForm.rconPassword}
                                        onChange={e => setNewServerForm({ ...newServerForm, rconPassword: e.target.value })}
                                        className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-story-gold"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateServerModalOpen(false)}
                                    className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl font-bold hover:bg-white/20"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-story-gold text-black rounded-xl font-bold hover:bg-story-gold-light shadow-md"
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
