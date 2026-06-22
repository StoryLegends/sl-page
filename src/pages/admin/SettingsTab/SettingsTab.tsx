import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Switch, InputNumber, Card, Divider, Row, Col, Space, Modal, Alert, message, Typography } from 'antd';
import { WarningOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminApi, type SiteSettings } from '../../../api/admin';
import { useAuth } from '../../../context/AuthContext';

const { Title, Paragraph } = Typography;

const SettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetVisible, setResetVisible] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const { user } = useAuth();

    const [form] = Form.useForm();
    const [resetForm] = Form.useForm();

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSettings();
            setSettings(data);
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
        <div className="space-y-6 animate-fadeIn text-white">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#14213d] p-4 rounded-2xl border border-white/5">
                <span className="text-gray-400 font-medium">Конфигурация проекта и параметры безопасности</span>
                <Button 
                    type="default" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchSettings}
                    loading={loading}
                    className="border-white/10 hover:border-story-gold text-gray-300 hover:text-story-gold bg-transparent rounded-xl"
                >
                    Обновить настройки
                </Button>
            </div>

            {loading && !settings ? (
                <div className="py-20 text-center"><Card className="bg-[#14213d] border-white/5 text-gray-400">Загрузка конфигурации...</Card></div>
            ) : (
                <Form form={form} layout="vertical" onFinish={handleSaveSettings} className="space-y-6">
                    <Row gutter={[20, 20]}>
                        <Col xs={24} md={16}>
                            <Card 
                                className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg"
                                title={<span className="text-white font-bold font-minecraft text-lg">Параметры сайта</span>}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="applicationsOpen" label="Прием заявок игроков" valuePropName="checked">
                                            <Switch checkedChildren="ОТКРЫТ" unCheckedChildren="ЗАКРЫТ" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="registrationOpen" label="Регистрация на сайте" valuePropName="checked">
                                            <Switch checkedChildren="ОТКРЫТА" unCheckedChildren="ЗАКРЫТА" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider style={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                                <Title level={5} style={{ color: '#fff' }} className="mb-4">Настройки наказаний (Варнов)</Title>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="maxWarningsBeforeBan" label="Лимит варнов до автобана">
                                            <InputNumber min={1} max={10} className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="autoBanOnMaxWarnings" label="Автобан при достижении лимита" valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24} md={8}>
                            <Card 
                                className="bg-[#14213d] border border-white/5 rounded-2xl shadow-lg"
                                title={<span className="text-white font-bold font-minecraft text-lg">Оповещения</span>}
                            >
                                <div className="space-y-4">
                                    <Form.Item name="sendEmailOnWarning" label="Email при варне" valuePropName="checked" className="mb-2">
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Form.Item name="sendDiscordDmOnWarning" label="Discord ЛС при варне" valuePropName="checked" className="mb-2">
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Form.Item name="sendEmailOnBan" label="Email при бане" valuePropName="checked" className="mb-2">
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Form.Item name="sendDiscordDmOnBan" label="Discord ЛС при бане" valuePropName="checked" className="mb-2">
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Form.Item name="sendEmailOnApplicationApproved" label="Email при одобрении заявки" valuePropName="checked" className="mb-2">
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Form.Item name="sendEmailOnApplicationRejected" label="Email при отказе заявки" valuePropName="checked" className="mb-0">
                                        <Switch size="small" />
                                    </Form.Item>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Bottom Save bar */}
                    <div className="flex justify-end gap-3 bg-[#14213d] p-4 rounded-2xl border border-white/5">
                        <Button type="primary" htmlType="submit" loading={saving} className="bg-story-gold text-black border-none font-semibold hover:bg-story-gold-light">
                            Сохранить изменения
                        </Button>
                    </div>
                </Form>
            )}

            {/* Critical actions & database */}
            <Card 
                                className="bg-[#14213d] border border-red-950/30 rounded-2xl shadow-lg"
                title={<span className="text-red-500 font-bold font-minecraft text-lg">Опасная зона (Критические действия)</span>}
            >
                <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                        <div className="space-y-2">
                            <Title level={5} style={{ color: '#fff', margin: 0 }}>Резервная копия БД</Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                                Скачать полный дамп базы данных PostgreSQL. Включает таблицы игроков, логов и заявок.
                            </Paragraph>
                            <Button 
                                type="default" 
                                icon={<DownloadOutlined />} 
                                onClick={handleDownloadBackup}
                                className="border-white/10 hover:border-story-gold text-gray-300 hover:text-story-gold bg-transparent"
                            >
                                Скачать Backup (.sql)
                            </Button>
                        </div>
                    </Col>
                    
                    <Col xs={24} md={12} className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                        <div className="space-y-2">
                            <Title level={5} style={{ color: '#ff4d4f', margin: 0 }}>Сброс сезона (Reset Season)</Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                                Сбрасывает флаг сезона у всех игроков. Все игроки будут переведены в статус ожидания и должны будут подать новую заявку для игры в следующем сезоне.
                            </Paragraph>
                            <Button 
                                type="primary" 
                                danger
                                icon={<WarningOutlined />} 
                                onClick={() => setResetVisible(true)}
                            >
                                Сбросить сезон
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Modal: Confirm Reset Season */}
            <Modal
                title={<span className="text-red-500 font-bold font-minecraft flex items-center gap-2"><WarningOutlined /> КРИТИЧЕСКОЕ ДЕЙСТВИЕ</span>}
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
                    />
                    
                    {user?.totpEnabled && (
                        <Form.Item name="totpCode" label="Двухфакторный код подтверждения (2FA)" rules={[{ required: true, message: 'Введите код 2FA' }]}>
                            <Input placeholder="123456" maxLength={6} style={{ letterSpacing: 4, textAlign: 'center', fontSize: 18 }} />
                        </Form.Item>
                    )}

                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setResetVisible(false)}>Отмена</Button>
                            <Button type="primary" danger htmlType="submit" loading={resetLoading}>
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

