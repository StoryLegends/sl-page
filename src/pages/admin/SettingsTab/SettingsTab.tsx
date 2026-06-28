import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Switch, InputNumber, Space, Modal, Alert, message } from 'antd';
import { Sliders, Shield, Bell, Database, AlertTriangle, RefreshCw, Download, AlertCircle, Settings } from 'lucide-react';
import { adminApi, type SiteSettings } from '../../../api/admin';
import { useAuth } from '../../../context/AuthContext';

const SettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetVisible, setResetVisible] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [maintenanceActive, setMaintenanceActive] = useState(false);
    const { user } = useAuth();

    const [form] = Form.useForm();
    const [resetForm] = Form.useForm();

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSettings();
            setSettings(data);
            setMaintenanceActive(data.maintenanceMode);
            form.setFieldsValue(data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            message.error('Не удалось загрузить настройки сайта');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSaveSettings = async (values: any) => {
        setSaving(true);
        try {
            const updated = await adminApi.updateSettings(values);
            setSettings(updated);
            setMaintenanceActive(updated.maintenanceMode);
            message.success('Настройки успешно сохранены');
        } catch (err) {
            console.error('Failed to save settings:', err);
            message.error('Не удалось сохранить настройки');
        } finally {
            setSaving(false);
        }
    };

    const handleResetSeason = async (values: any) => {
        setResetLoading(true);
        try {
            await adminApi.resetSeason(values.totpCode || undefined);
            message.success('Сезон успешно сброшен, все профили обновлены!');
            setResetVisible(false);
            resetForm.resetFields();
        } catch (err: any) {
            console.error('Failed to reset season:', err);
            message.error(err.response?.data?.message || 'Не удалось сбросить сезон. Проверьте код 2FA.');
        } finally {
            setResetLoading(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            const blob = await adminApi.downloadBackup();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slbackend-backup-${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            message.success('Резервная копия скачана');
        } catch (err) {
            console.error('Failed to download backup:', err);
            message.error('Не удалось скачать резервную копию базы данных');
        }
    };

    return (
        <div className="space-y-4 animate-fadeIn text-white max-w-4xl mx-auto">
            {/* Header Banner */}
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                    <h2 className="text-lg font-bold font-minecraft tracking-wide text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-legends-blue" />
                        Конфигурация проекта
                    </h2>
                    <p className="text-gray-400 text-xs">Управление параметрами доступа к сайту, безопасности и оповещений.</p>
                </div>
                <Button 
                    type="default" 
                    icon={<RefreshCw className="w-3.5 h-3.5 mr-1" />} 
                    onClick={fetchSettings}
                    loading={loading}
                    className="border-white/10 hover:border-legends-blue text-gray-300 hover:text-legends-blue bg-transparent rounded-lg h-9 px-3 flex items-center text-xs transition-all duration-300"
                >
                    Обновить данные
                </Button>
            </div>

            {loading && !settings ? (
                <div className="py-20 text-center">
                    <div className="bg-black/30 backdrop-blur-md border border-white/5 text-gray-400 rounded-xl p-6 flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-legends-blue"></div>
                        <span>Загрузка конфигурации...</span>
                    </div>
                </div>
            ) : (
                <Form 
                    form={form} 
                    layout="horizontal" 
                    onFinish={handleSaveSettings} 
                    onValuesChange={(changedValues) => {
                        if (changedValues.maintenanceMode !== undefined) {
                            setMaintenanceActive(changedValues.maintenanceMode);
                        }
                    }}
                >
                    {/* Unified Settings List Container */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-5 backdrop-blur-md shadow-xl space-y-5">
                        
                        {/* SECTION: MAINTENANCE */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Режим обслуживания
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="space-y-0.5 pr-4">
                                    <div className="text-sm font-semibold text-white">Режим техобслуживания</div>
                                    <div className="text-xs text-gray-400">Закрывает доступ к сайту (ошибка 503) для всех, кроме администрации.</div>
                                </div>
                                <Form.Item name="maintenanceMode" valuePropName="checked" className="mb-0">
                                    <Switch className={maintenanceActive ? 'bg-amber-500' : ''} />
                                </Form.Item>
                            </div>
                            {maintenanceActive && (
                                <div className="mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs p-2.5 rounded-lg leading-relaxed flex gap-2 items-start">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        Режим обслуживания включен. Вход и регистрация обычных игроков закрыты. Проверки reCAPTCHA отключены для админов.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION: ACCESS CONFIG */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Sliders className="w-3 h-3 text-legends-blue" />
                                Доступ к сайту
                            </div>
                            
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-semibold text-white">Прием заявок игроков</div>
                                    <div className="text-xs text-gray-400">Разрешает или запрещает отправку новых анкет.</div>
                                </div>
                                <Form.Item name="applicationsOpen" valuePropName="checked" className="mb-0">
                                    <Switch checkedChildren="ОТКРЫТ" unCheckedChildren="ЗАКРЫТ" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-semibold text-white">Регистрация на сайте</div>
                                    <div className="text-xs text-gray-400">Разрешает создание новых учетных записей.</div>
                                </div>
                                <Form.Item name="registrationOpen" valuePropName="checked" className="mb-0">
                                    <Switch checkedChildren="ОТКРЫТА" unCheckedChildren="ЗАКРЫТА" />
                                </Form.Item>
                            </div>
                        </div>

                        {/* SECTION: WARNINGS & BAN */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-legends-blue" />
                                Правила и автоматические наказания
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-semibold text-white">Автобан при достижении лимита</div>
                                    <div className="text-xs text-gray-400">Автоматически банить игрока, если превышен лимит варнов.</div>
                                </div>
                                <Form.Item name="autoBanOnMaxWarnings" valuePropName="checked" className="mb-0">
                                    <Switch />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-semibold text-white">Лимит варнов до автобана</div>
                                    <div className="text-xs text-gray-400">Количество предупреждений, после которого следует автобан.</div>
                                </div>
                                <Form.Item name="maxWarningsBeforeBan" className="mb-0">
                                    <InputNumber min={1} max={10} className="w-20 bg-white/5 border-white/10 text-white rounded-lg text-center" />
                                </Form.Item>
                            </div>
                        </div>

                        {/* SECTION: NOTIFICATIONS */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Bell className="w-3 h-3 text-legends-blue" />
                                Оповещения
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-gray-200">Email-уведомление при выдаче варна</div>
                                <Form.Item name="sendEmailOnWarning" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-gray-200">Discord ЛС-уведомление при выдаче варна</div>
                                <Form.Item name="sendDiscordDmOnWarning" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-gray-200">Email-уведомление при бане аккаунта</div>
                                <Form.Item name="sendEmailOnBan" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-gray-200">Discord ЛС-уведомление при бане аккаунта</div>
                                <Form.Item name="sendDiscordDmOnBan" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-gray-200">Email-уведомление при одобрении заявки</div>
                                <Form.Item name="sendEmailOnApplicationApproved" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="text-sm font-medium text-gray-200">Email-уведомление при отклонении заявки</div>
                                <Form.Item name="sendEmailOnApplicationRejected" valuePropName="checked" className="mb-0">
                                    <Switch size="small" />
                                </Form.Item>
                            </div>
                        </div>

                        {/* Save Changes Button */}
                        <div className="pt-2 flex justify-end">
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={saving} 
                                className="bg-legends-blue text-black border-none font-semibold hover:bg-legends-blue-light rounded-lg h-9 px-5 transition-all duration-300 shadow-md shadow-legends-blue/10"
                            >
                                Сохранить изменения
                            </Button>
                        </div>
                    </div>
                </Form>
            )}

            {/* Critical actions & database */}
            <div className="bg-black/30 border border-red-950/20 rounded-xl p-5 backdrop-blur-md shadow-xl space-y-4">
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    Опасная зона (Критические действия)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-legends-blue" />
                            Резервная копия БД
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Скачать дамп базы данных PostgreSQL (игроки, логи, заявки).
                        </p>
                        <Button 
                            type="default" 
                            icon={<Download className="w-3.5 h-3.5 mr-1" />} 
                            onClick={handleDownloadBackup}
                            className="border-white/10 hover:border-legends-blue text-gray-300 hover:text-legends-blue bg-transparent hover:bg-legends-blue/5 rounded-lg h-9 px-3 flex items-center text-xs transition-all duration-300"
                        >
                            Скачать Backup (.sql)
                        </Button>
                    </div>
                    
                    <div className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 space-y-2">
                        <div className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            Сброс сезона (Reset Season)
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Сбрасывает статус сезона. Игрокам нужно будет подать новую заявку.
                        </p>
                        <Button 
                            type="primary" 
                            danger
                            icon={<RefreshCw className="w-3.5 h-3.5 mr-1" />} 
                            onClick={() => setResetVisible(true)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30 rounded-lg h-9 px-3 flex items-center text-xs transition-all duration-300"
                        >
                            Сбросить сезон
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal: Confirm Reset Season */}
            <Modal
                title={
                    <span className="text-red-500 font-bold font-minecraft flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> 
                        КРИТИЧЕСКОЕ ДЕЙСТВИЕ
                    </span>
                }
                open={resetVisible}
                onCancel={() => setResetVisible(false)}
                footer={null}
                className="custom-modal"
            >
                <Form form={resetForm} layout="vertical" onFinish={handleResetSeason} className="pt-4 space-y-4">
                    <Alert
                        message="Внимание!"
                        description="Вы собираетесь сбросить сезон. Это заблокирует доступ на сервер Minecraft всем текущим игрокам, пока они не подадут новые заявки в новом сезоне."
                        type="error"
                        showIcon
                        className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg"
                    />
                    
                    {user?.totpEnabled && (
                        <Form.Item 
                            name="totpCode" 
                            label={<span className="text-gray-300">Двухфакторный код подтверждения (2FA)</span>} 
                            rules={[{ required: true, message: 'Введите код 2FA' }]}
                        >
                            <Input 
                                placeholder="123456" 
                                maxLength={6} 
                                className="bg-white/5 border-white/10 text-white rounded-lg text-center font-mono"
                                style={{ letterSpacing: 8, fontSize: 18 }} 
                            />
                        </Form.Item>
                    )}

                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button 
                                onClick={() => setResetVisible(false)}
                                className="bg-white/5 border-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                            >
                                Отмена
                            </Button>
                            <Button 
                                type="primary" 
                                danger 
                                htmlType="submit" 
                                loading={resetLoading}
                                className="bg-red-600 hover:bg-red-500 border-none rounded-lg"
                            >
                                Подтвердить сброс сезона
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SettingsTab;
