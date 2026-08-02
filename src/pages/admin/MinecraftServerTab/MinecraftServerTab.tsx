import React, { useEffect, useState, useRef } from 'react';
import { 
    Play, Square, RotateCw, Zap, Terminal, Cpu, HardDrive, Users, Activity, 
    Upload, Settings as SettingsIcon, Package, Server, Send, RefreshCw, CheckCircle2
} from 'lucide-react';
import { minecraftApi, type MinecraftStatus, type MinecraftPlugin, type MinecraftPlayer } from '../../../api/minecraft';
import { useNotification } from '../../../context/NotificationContext';

const MinecraftServerTab: React.FC = () => {
    const { showNotification } = useNotification();
    const [status, setStatus] = useState<MinecraftStatus | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'console' | 'plugins' | 'players' | 'config' | 'minio'>('console');
    
    // Console / Terminal state
    const [logs, setLogs] = useState<string[]>([]);
    const [command, setCommand] = useState('');
    const [cmdHistory, setCmdHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [autoScroll, setAutoScroll] = useState(true);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Plugins state
    const [plugins, setPlugins] = useState<MinecraftPlugin[]>([]);
    const [isUploadingPlugin, setIsUploadingPlugin] = useState(false);

    // Players state
    const [players, setPlayers] = useState<MinecraftPlayer[]>([]);

    // Config state
    const [configText, setConfigText] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const isOnline = status?.status === 'ONLINE';

    // Refresh server status every 4 seconds
    const fetchStatus = async () => {
        try {
            const data = await minecraftApi.getStatus();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch minecraft status', err);
        }
    };

    // Refresh console logs
    const fetchLogs = async () => {
        try {
            const logLines = await minecraftApi.getLogs();
            setLogs(logLines);
        } catch (err) {}
    };

    useEffect(() => {
        fetchStatus();
        fetchLogs();
        const interval = setInterval(() => {
            fetchStatus();
            if (activeSubTab === 'console') fetchLogs();
        }, 4000);
        return () => clearInterval(interval);
    }, [activeSubTab]);

    // Auto-scroll terminal
    useEffect(() => {
        if (autoScroll && activeSubTab === 'console') {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll, activeSubTab]);

    // Load sub-tab specific data
    useEffect(() => {
        if (activeSubTab === 'plugins') {
            minecraftApi.getPlugins().then(setPlugins).catch(console.error);
        } else if (activeSubTab === 'players') {
            minecraftApi.getPlayers().then(setPlayers).catch(console.error);
        } else if (activeSubTab === 'config') {
            minecraftApi.getConfig().then(setConfigText).catch(console.error);
        }
    }, [activeSubTab]);

    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        try {
            const res = await minecraftApi.powerAction(action);
            showNotification(res.message || 'Действие выполнено', 'success');
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
        setCmdHistory(prev => [cmdToRun, ...prev]);
        setHistoryIndex(-1);

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

    const handleKeyDownCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
                const nextIdx = historyIndex + 1;
                setHistoryIndex(nextIdx);
                setCommand(cmdHistory[nextIdx]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const nextIdx = historyIndex - 1;
                setHistoryIndex(nextIdx);
                setCommand(cmdHistory[nextIdx]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand('');
            }
        }
    };

    const handleUploadPluginFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPlugin(true);
        try {
            const res = await minecraftApi.uploadPlugin(file);
            showNotification(res.message || 'Плагин успешно загружен!', 'success');
            const updated = await minecraftApi.getPlugins();
            setPlugins(updated);
        } catch (err: any) {
            showNotification(err.response?.data?.error || 'Ошибка загрузки плагина', 'error');
        } finally {
            setIsUploadingPlugin(false);
        }
    };

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            const res = await minecraftApi.saveConfig(configText);
            showNotification(res.message || 'Конфигурация сохранена!', 'success');
        } catch (err) {
            showNotification('Ошибка при сохранении конфигурации.', 'error');
        } finally {
            setIsSavingConfig(false);
        }
    };

    return (
        <div className="space-y-6 w-full animate-fadeIn">
            {/* PTERODACTYL-STYLE HEADER BANNER */}
            <div className="p-6 rounded-2xl bg-[#091322] border border-white/10 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-story-gold/10 border border-story-gold/30 flex items-center justify-center shrink-0">
                            <Server className="w-6 h-6 text-story-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white tracking-wide">StoryLegends Minecraft Server</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-md ${
                                    isOnline 
                                        ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-ping' : 'bg-red-400'}`} />
                                    {isOnline ? 'ОНЛАЙН' : 'ВЫКЛЮЧЕН'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Docker Container: <code className="text-story-gold font-mono">{status?.containerName || 'sl-minecraft-server'}</code> • {status?.version || 'Paper 1.20.4'}</p>
                        </div>
                    </div>

                    {/* Power Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePowerAction('start')}
                            disabled={isOnline}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" /> Пуск
                        </button>

                        <button
                            onClick={() => handlePowerAction('restart')}
                            disabled={!isOnline}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                        >
                            <RotateCw className="w-3.5 h-3.5" /> Перезапуск
                        </button>

                        <button
                            onClick={() => handlePowerAction('stop')}
                            disabled={!isOnline}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                        >
                            <Square className="w-3.5 h-3.5 fill-current" /> Стоп
                        </button>

                        <button
                            onClick={() => handlePowerAction('kill')}
                            className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                            title="Принудительно выключить контейнер"
                        >
                            <Zap className="w-3.5 h-3.5 text-yellow-300" /> Выключить
                        </button>
                    </div>
                </div>

                {/* METRICS METERS BAR */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
                    {/* CPU % */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="flex items-center gap-1.5 font-bold"><Cpu className="w-4 h-4 text-blue-400" /> CPU Нагрузка</span>
                            <span className="font-mono text-white font-bold">{status?.cpuUsagePercent?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(status?.cpuUsagePercent || 0, 100)}%` }} />
                        </div>
                    </div>

                    {/* RAM */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="flex items-center gap-1.5 font-bold"><HardDrive className="w-4 h-4 text-purple-400" /> RAM Память</span>
                            <span className="font-mono text-white font-bold">{((status?.memoryUsedMb || 0) / 1024).toFixed(2)} / {((status?.memoryMaxMb || 4096) / 1024).toFixed(1)} GB</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(((status?.memoryUsedMb || 0) / (status?.memoryMaxMb || 4096)) * 100, 100)}%` }} />
                        </div>
                    </div>

                    {/* TPS */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="flex items-center gap-1.5 font-bold"><Activity className="w-4 h-4 text-green-400" /> TPS (Скорость)</span>
                            <span className="font-mono text-green-400 font-bold">{status?.tps?.toFixed(1) || '0.0'} TPS</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${((status?.tps || 0) / 20.0) * 100}%` }} />
                        </div>
                    </div>

                    {/* ONLINE PLAYERS */}
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
                    onClick={() => setActiveSubTab('console')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'console' ? 'bg-story-gold text-black shadow-lg' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Terminal className="w-4 h-4" /> Консоль и Терминал
                </button>

                <button
                    onClick={() => setActiveSubTab('plugins')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'plugins' ? 'bg-story-gold text-black shadow-lg' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Package className="w-4 h-4" /> Плагины и Моды
                </button>

                <button
                    onClick={() => setActiveSubTab('players')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'players' ? 'bg-story-gold text-black shadow-lg' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <Users className="w-4 h-4" /> Игроки Онлайн
                </button>

                <button
                    onClick={() => setActiveSubTab('config')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeSubTab === 'config' ? 'bg-story-gold text-black shadow-lg' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <SettingsIcon className="w-4 h-4" /> server.properties
                </button>
            </div>

            {/* SUB-TAB 1: LIVE CONSOLE & TERMINAL */}
            {activeSubTab === 'console' && (
                <div className="bg-[#050b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                        <span className="font-mono text-gray-400 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-story-gold" />
                            Live Minecraft RCON Console Stream
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

                    {/* Dark Terminal Window */}
                    <div className="bg-black/90 p-4 rounded-xl font-mono text-xs text-green-400 h-[450px] overflow-y-auto space-y-1.5 border border-white/10 shadow-inner select-text">
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

                    {/* RCON Command Input Box */}
                    <form onSubmit={handleSendCommand} className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3.5 top-3 text-story-gold font-mono font-bold text-sm">&gt;</span>
                            <input
                                type="text"
                                value={command}
                                onChange={e => setCommand(e.target.value)}
                                onKeyDown={handleKeyDownCommand}
                                className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-story-gold/60"
                                placeholder="Введите команду RCON (например: op nickname, whitelist add name, say Hello!)..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all flex items-center gap-2 shrink-0 shadow-lg"
                        >
                            <Send className="w-4 h-4" /> Отправить
                        </button>
                    </form>
                </div>
            )}

            {/* SUB-TAB 2: PLUGINS & MODS MANAGER */}
            {activeSubTab === 'plugins' && (
                <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-story-gold" />
                                Плагины и Моды сервера (.jar)
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Загруженные плагины автоматически синхронизируются с MinIO S3 и папкой /plugins сервера</p>
                        </div>

                        <label className={`px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-2 ${isUploadingPlugin ? 'opacity-50' : ''}`}>
                            <Upload className="w-4 h-4" />
                            {isUploadingPlugin ? 'Загрузка плагина...' : 'Загрузить .jar плагин'}
                            <input
                                type="file"
                                accept=".jar"
                                className="hidden"
                                onChange={handleUploadPluginFile}
                                disabled={isUploadingPlugin}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plugins.map((plugin, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                                        JAR
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{plugin.filename}</h4>
                                        <span className="text-xs text-gray-400 font-mono">{(plugin.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                                    Активен
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SUB-TAB 3: PLAYERS ONLINE */}
            {activeSubTab === 'players' && (
                <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-story-gold" />
                            Игроки на сервере
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

            {/* SUB-TAB 4: CONFIG EDITOR */}
            {activeSubTab === 'config' && (
                <div className="bg-[#091322] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-story-gold" />
                                Редактирование server.properties
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Прямое редактирование конфигурации портов, сложности и параметров выживания</p>
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            disabled={isSavingConfig}
                            className="px-5 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-all shadow-lg flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSavingConfig ? 'Сохранение...' : 'Сохранить конфиг'}
                        </button>
                    </div>

                    <textarea
                        value={configText}
                        onChange={e => setConfigText(e.target.value)}
                        className="w-full bg-black/80 border border-white/15 rounded-xl p-4 text-green-400 font-mono text-xs leading-relaxed h-[480px] focus:outline-none focus:border-story-gold/60 select-text"
                    />
                </div>
            )}
        </div>
    );
};

export default MinecraftServerTab;
