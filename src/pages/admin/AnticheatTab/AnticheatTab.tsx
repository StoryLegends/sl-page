import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Modal, Form, Tabs, Descriptions, List, Spin, message, Typography, Alert } from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    SafetyOutlined,
    PlusOutlined,
    DeleteOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { anticheatApi, knownModsApi, type AnticheatSnapshot, type KnownMod, type ProcessInfo, type ModEntry } from '../../../api/admin';

const { Option } = Select;
const { Text } = Typography;

const AnticheatTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState('snapshots');

    // Snapshots states
    const [snapshots, setSnapshots] = useState<AnticheatSnapshot[]>([]);
    const [snapLoading, setSnapLoading] = useState(false);
    const [snapTotal, setSnapTotal] = useState(0);
    const [snapPage, setSnapPage] = useState(0);
    const snapPageSize = 20;
    const [snapSearch, setSnapSearch] = useState('');
    const [onlySuspicious, setOnlySuspicious] = useState(false);


    // Known Mods states
    const [knownMods, setKnownMods] = useState<KnownMod[]>([]);
    const [modsLoading, setModsLoading] = useState(false);
    const [isModModalVisible, setIsModModalVisible] = useState(false);
    const [modSearch, setModSearch] = useState('');

    // Modals
    const [selectedSnapshot, setSelectedSnapshot] = useState<AnticheatSnapshot | null>(null);
    const [isSnapModalVisible, setIsSnapModalVisible] = useState(false);
    const [snapDetailsLoading, setSnapDetailsLoading] = useState(false);

    // Filter inner lists in snapshot detail
    const [processSearch, setProcessSearch] = useState('');
    const [innerModSearch, setInnerModSearch] = useState('');



    const [modForm] = Form.useForm();

    const fetchSnapshots = async (currentPage = snapPage, query = snapSearch) => {
        setSnapLoading(true);
        try {
            const data = await anticheatApi.getAllSnapshots(query || undefined, currentPage, snapPageSize);
            setSnapshots(data.content || []);
            setSnapTotal(data.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch snapshots:', err);
            message.error('Не удалось загрузить снапшоты античита');
        } finally {
            setSnapLoading(false);
        }
    };

    const fetchKnownMods = async () => {
        setModsLoading(true);
        try {
            const data = await knownModsApi.getAll();
            setKnownMods(data || []);
        } catch (err) {
            console.error('Failed to fetch known mods:', err);
            message.error('Не удалось загрузить список модов');
        } finally {
            setModsLoading(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'snapshots') {
            fetchSnapshots(0, snapSearch);
            setSnapPage(0);
        } else {
            fetchKnownMods();
        }
    }, [activeSubTab]);

    const handleSnapSearch = () => {
        fetchSnapshots(0, snapSearch);
        setSnapPage(0);
    };

    const handleSnapTableChange = (pagination: any) => {
        const newPage = pagination.current - 1;
        setSnapPage(newPage);
        fetchSnapshots(newPage, snapSearch);
    };

    const handleOpenSnapModal = async (snapshot: AnticheatSnapshot) => {
        setSelectedSnapshot(snapshot);
        setIsSnapModalVisible(true);
        setSnapDetailsLoading(true);
        setProcessSearch('');
        setInnerModSearch('');
        try {
            // Load full snapshot details with logs if needed
            const fullData = await anticheatApi.getSnapshot(snapshot.id, true);
            setSelectedSnapshot(fullData);
        } catch (err) {
            console.error('Failed to load snapshot details:', err);
            message.error('Не удалось загрузить детали снапшота');
        } finally {
            setSnapDetailsLoading(false);
        }
    };

    const handleAddKnownMod = async (values: any) => {
        try {
            await knownModsApi.save(values);
            message.success('Мод добавлен в список');
            setIsModModalVisible(false);
            modForm.resetFields();
            fetchKnownMods();
        } catch (err) {
            console.error('Failed to add known mod:', err);
            message.error('Не удалось сохранить мод');
        }
    };

    const handleDeleteKnownMod = async (id: number) => {
        Modal.confirm({
            title: 'Удалить мод из списка?',
            content: 'Это уберет его статус доверенного/подозрительного, и он будет отображаться как неизвестный в снапшотах.',
            okText: 'Удалить',
            cancelText: 'Отмена',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await knownModsApi.delete(id);
                    message.success('Мод удален из списка');
                    fetchKnownMods();
                } catch (err) {
                    console.error('Failed to delete known mod:', err);
                    message.error('Не удалось удалить мод');
                }
            }
        });
    };

    // Columns for Snapshots
    const snapColumns = [
        {
            title: 'Игрок',
            key: 'player',
            render: (_: any, record: AnticheatSnapshot) => (
                <Text style={{ color: '#fff' }} className="font-bold cursor-pointer hover:text-story-gold transition-colors">
                    {record.playerName}
                </Text>
            )
        },
        {
            title: 'Лаунчер',
            key: 'launcher',
            render: (_: any, record: AnticheatSnapshot) => (
                <div>
                    <Text style={{ color: '#fff' }} className="text-xs font-semibold">{record.launcherName || '—'}</Text>
                    <div className="text-[10px] text-gray-500">{record.launcherBrand || 'vanilla'}</div>
                </div>
            )
        },
        {
            title: 'Моды',
            key: 'mods',
            render: (_: any, record: AnticheatSnapshot) => {
                const total = record.mods?.length || 0;
                const suspicious = record.mods?.filter((m: any) => m.status === 'SUSPICIOUS').length || 0;
                
                if (suspicious > 0) {
                    return <Tag color="red" icon={<WarningOutlined />}>Подозрительных: {suspicious} / {total}</Tag>;
                }
                return <Tag color="success" icon={<CheckCircleOutlined />}>Чисто: {total}</Tag>;
            }
        },
        {
            title: 'Процессы',
            key: 'processes',
            render: (_: any, record: AnticheatSnapshot) => (
                <Tag color="blue">Процессов: {record.processes?.length || 0}</Tag>
            )
        },
        {
            title: 'Аномальность',
            key: 'anomaly',
            render: (_: any, record: AnticheatSnapshot) => {
                if (record.suspicious) {
                    const scorePercent = Math.round((record.anomalyScore || 0) * 100);
                    return (
                        <Space direction="vertical" size={0}>
                            <Tag color="red" icon={<WarningOutlined />} className="font-bold">
                                ПОДОЗРИТЕЛЬНО ({scorePercent}%)
                            </Tag>
                        </Space>
                    );
                }
                return <Tag color="success">Чисто</Tag>;
            }
        },
        {
            title: 'Дата',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <Text className="text-gray-500 text-xs font-mono">{new Date(date).toLocaleString('ru-RU')}</Text>
        },

        {
            title: 'Действие',
            key: 'action',
            render: (_: any, record: AnticheatSnapshot) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    onClick={() => handleOpenSnapModal(record)}
                    className="border-story-gold text-story-gold hover:bg-story-gold/10 rounded-xl"
                >
                    Детали
                </Button>
            )
        }
    ];

    // Columns for Known Mods
    const modColumns = [
        {
            title: 'Имя мода / Файл',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <code className="text-gray-300 font-semibold">{name}</code>
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                status === 'TRUSTED' ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>ДОВЕРЕННЫЙ</Tag>
                ) : (
                    <Tag color="red" icon={<WarningOutlined />}>ПОДОЗРИТЕЛЬНЫЙ</Tag>
                )
            )
        },
        {
            title: 'Добавил',
            dataIndex: 'addedBy',
            key: 'addedBy',
            render: (addedBy: string) => <Tag color="blue">{addedBy}</Tag>
        },
        {
            title: 'Заметки',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes: string) => <Text className="text-gray-400 text-xs">{notes || '—'}</Text>
        },
        {
            title: 'Действие',
            key: 'action',
            render: (_: any, record: KnownMod) => (
                <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteKnownMod(record.id)}
                >
                    Удалить
                </Button>
            )
        }
    ];

    // Filtered lists for snapshot details modal
    const filteredProcesses = selectedSnapshot?.processes?.filter(p => 
        p.imageName?.toLowerCase().includes(processSearch.toLowerCase()) ||
        p.windowTitle?.toLowerCase().includes(processSearch.toLowerCase())
    ) || [];

    const filteredMods = selectedSnapshot?.mods?.filter(m =>
        m.name?.toLowerCase().includes(innerModSearch.toLowerCase())
    ) || [];

    const filteredKnownModsList = knownMods.filter(m =>
        m.name?.toLowerCase().includes(modSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Tabs */}
            <Tabs
                activeKey={activeSubTab}
                onChange={setActiveSubTab}
                items={[
                    {
                        key: 'snapshots',
                        label: (
                            <span className="font-semibold text-sm">
                                <SafetyOutlined /> Снапшоты античита
                            </span>
                        ),
                        children: (
                            <div className="space-y-6 pt-2">
                                {/* Search Filter */}
                                <div className="flex flex-wrap items-center gap-3 bg-[#14213d] p-4 rounded-2xl border border-white/5">
                                    <Input
                                        placeholder="Поиск по нику игрока..."
                                        prefix={<SearchOutlined className="text-gray-500" />}
                                        value={snapSearch}
                                        onChange={e => setSnapSearch(e.target.value)}
                                        onPressEnter={handleSnapSearch}
                                        className="text-white w-full sm:w-64 rounded-xl"
                                    />
                                    <Button type="primary" onClick={handleSnapSearch} className="bg-story-gold text-black font-semibold hover:bg-story-gold-light border-none rounded-xl">
                                        Найти
                                    </Button>
                                    <Button
                                        type={onlySuspicious ? "primary" : "default"}
                                        danger={onlySuspicious}
                                        onClick={() => setOnlySuspicious(!onlySuspicious)}
                                        className="rounded-xl font-semibold"
                                    >
                                        {onlySuspicious ? "Все снапшоты" : "Только подозрительные"}
                                    </Button>
                                </div>

                                {/* Table */}
                                <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                    <Table
                                        dataSource={onlySuspicious ? snapshots.filter(s => s.suspicious) : snapshots}
                                        columns={snapColumns}
                                        rowKey="id"
                                        loading={snapLoading}
                                        pagination={{
                                            current: snapPage + 1,
                                            pageSize: snapPageSize,
                                            total: onlySuspicious ? snapshots.filter(s => s.suspicious).length : snapTotal,
                                            showSizeChanger: false
                                        }}
                                        onChange={handleSnapTableChange}
                                        className="custom-table"
                                    />
                                </div>
                            </div>
                        )
                    },

                    {
                        key: 'known-mods',
                        label: (
                            <span className="font-semibold text-sm">
                                <InfoCircleOutlined /> База модов
                            </span>
                        ),
                        children: (
                            <div className="space-y-6 pt-2">
                                {/* Search Filter and Add btn */}
                                <div className="flex justify-between items-center bg-[#14213d] p-4 rounded-2xl border border-white/5">
                                    <Input
                                        placeholder="Поиск мода по названию..."
                                        prefix={<SearchOutlined className="text-gray-500" />}
                                        value={modSearch}
                                        onChange={e => setModSearch(e.target.value)}
                                        className="text-white w-full sm:w-64 rounded-xl"
                                    />
                                    <Button
                                        type="primary"
                                        ghost
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsModModalVisible(true)}
                                        className="border-story-gold text-story-gold hover:bg-story-gold/10 rounded-xl font-semibold"
                                    >
                                        Добавить мод
                                    </Button>
                                </div>

                                {/* Table */}
                                <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                    <Table
                                        dataSource={filteredKnownModsList}
                                        columns={modColumns}
                                        rowKey="id"
                                        loading={modsLoading}
                                        className="custom-table"
                                    />
                                </div>
                            </div>
                        )
                    }
                ]}
            />

            {/* Modal: View Snapshot Detail */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <SafetyOutlined style={{ color: '#FFD700' }} />
                        <span className="text-white font-bold font-minecraft">Снапшот античита #{selectedSnapshot?.id} ({selectedSnapshot?.playerName})</span>
                    </div>
                }
                open={isSnapModalVisible}
                onCancel={() => setIsSnapModalVisible(false)}
                footer={null}
                width={850}
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
                                    <div className="space-y-2 mt-1">
                                        <div>Коэффициент аномальности: <span className="font-bold text-red-400">{Math.round((selectedSnapshot.anomalyScore || 0) * 100)}%</span></div>
                                        <div>Детали аномалий: <span className="italic text-gray-300">{selectedSnapshot.anomalyDetails || '—'}</span></div>
                                    </div>
                                }
                                type="error"
                                showIcon
                                className="border-red-500/20 bg-red-950/20 text-red-200 rounded-xl"
                            />
                        )}

                        {/* Device / Client metadata */}
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" className="border-white/5 rounded-xl overflow-hidden bg-black/10 text-gray-300">
                            <Descriptions.Item label="Игрок">{selectedSnapshot.playerName}</Descriptions.Item>
                            <Descriptions.Item label="Лаунчер">{selectedSnapshot.launcherName} ({selectedSnapshot.launcherBrand})</Descriptions.Item>
                            <Descriptions.Item label="Дата снапшота">{new Date(selectedSnapshot.createdAt).toLocaleString('ru-RU')}</Descriptions.Item>
                            <Descriptions.Item label="UUID">{selectedSnapshot.playerUuid || '—'}</Descriptions.Item>
                        </Descriptions>

                        {/* Sub-tabs for Snapshot details: Mods, Processes, Resource packs */}
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
                                                className="bg-black/30 border-white/5 rounded-xl"
                                            />
                                            <List
                                                bordered
                                                className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto"
                                                dataSource={filteredMods}
                                                renderItem={(mod: ModEntry) => (
                                                    <List.Item className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                        <code className="text-gray-300 text-xs">{mod.name}</code>
                                                        <Space>
                                                            {mod.status === 'TRUSTED' ? (
                                                                <Tag color="success" className="text-[9px]">ДОВЕРЕННЫЙ</Tag>
                                                            ) : mod.status === 'SUSPICIOUS' ? (
                                                                <Tag color="red" icon={<WarningOutlined />} className="text-[9px] font-bold">ПОДОЗРИТЕЛЬНЫЙ</Tag>
                                                            ) : (
                                                                <Tag color="warning" className="text-[9px]">НЕИЗВЕСТНЫЙ</Tag>
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
                                                className="bg-black/30 border-white/5 rounded-xl"
                                            />
                                            <List
                                                bordered
                                                className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto"
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
                                                className="border-white/5 bg-black/10 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto"
                                                dataSource={selectedSnapshot.resourcePacks || []}
                                                renderItem={(pack: string) => (
                                                    <List.Item className="px-4 py-2 border-b border-white/5 text-gray-300 text-xs">
                                                        {pack}
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

            {/* Modal: Add Known Mod */}
            <Modal
                title={<span className="text-white font-bold font-minecraft">Добавить мод в базу данных</span>}
                open={isModModalVisible}
                onCancel={() => setIsModModalVisible(false)}
                footer={null}
                className="custom-modal"
            >
                <Form form={modForm} layout="vertical" onFinish={handleAddKnownMod} className="pt-4">
                    <Form.Item name="name" label="Название файла мода" rules={[{ required: true, message: 'Обязательное поле' }]} extra="Например: Wurst-Client-v7.jar или OptiFine_1.20.jar">
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="Статус мода" rules={[{ required: true }]} initialValue="TRUSTED">
                        <Select>
                            <Option value="TRUSTED">Доверенный (TRUSTED)</Option>
                            <Option value="SUSPICIOUS">Подозрительный / Запрещенный (SUSPICIOUS)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="notes" label="Заметки / Описание">
                        <Input.TextArea rows={3} placeholder="Опциональное описание назначения мода..." />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsModModalVisible(false)}>Отмена</Button>
                            <Button type="primary" htmlType="submit" className="bg-story-gold text-black border-none font-semibold">Сохранить</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AnticheatTab;

