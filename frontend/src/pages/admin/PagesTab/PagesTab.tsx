import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, CodeOutlined } from '@ant-design/icons';
import { customPagesApi, type CustomPage } from '../../../api/customPages';

const PagesTab: React.FC = () => {
    const [pages, setPages] = useState<CustomPage[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
    const [form] = Form.useForm();

    const fetchPages = async () => {
        setLoading(true);
        try {
            const data = await customPagesApi.getMany();
            setPages(data);
        } catch (err) {
            console.error('Failed to fetch pages:', err);
            message.error('Не удалось загрузить список страниц');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingPage(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (page: CustomPage) => {
        setEditingPage(page);
        form.setFieldsValue({
            title: page.title,
            path: page.path,
            htmlContent: page.htmlContent
        });
        setIsModalVisible(true);
    };

    const handleSavePage = async (values: any) => {
        try {
            if (editingPage) {
                await customPagesApi.update(editingPage.id, values);
                message.success('Страница успешно обновлена');
            } else {
                await customPagesApi.create(values);
                message.success('Страница успешно создана');
            }
            setIsModalVisible(false);
            fetchPages();
        } catch (err: any) {
            console.error('Failed to save custom page:', err);
            message.error(err.response?.data?.message || 'Не удалось сохранить страницу');
        }
    };

    const handleDeletePage = async (id: number) => {
        try {
            await customPagesApi.delete(id);
            message.success('Страница удалена');
            fetchPages();
        } catch (err) {
            console.error('Failed to delete custom page:', err);
            message.error('Не удалось удалить страницу');
        }
    };

    // Columns config
    const columns = [
        {
            title: 'Заголовок страницы',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <span className="font-bold text-white">{text}</span>
        },
        {
            title: 'Путь (URL)',
            dataIndex: 'path',
            key: 'path',
            render: (path: string) => (
                <Space>
                    <LinkOutlined className="text-gray-500" />
                    <code className="text-story-gold">/{path}</code>
                </Space>
            )
        },
        {
            title: 'Дата создания',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date?: string) => date ? new Date(date).toLocaleDateString('ru-RU') : '—'
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: CustomPage) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleOpenEditModal(record)} 
                        className="text-gray-400 hover:text-white"
                    />
                    <Popconfirm
                        title="Удалить эту страницу?"
                        description="Действие необратимо. Страница перестанет быть доступной по её URL."
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeletePage(record.id)}
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

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center bg-[#14213d] p-4 rounded-2xl border border-white/5">
                <span className="text-gray-400 font-medium">Кастомные HTML-страницы на сайте</span>
                <Button
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateModal}
                    className="border-story-gold text-story-gold hover:bg-story-gold/10 rounded-xl font-semibold"
                >
                    Создать страницу
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#14213d] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <Table
                    dataSource={pages}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    className="custom-table"
                />
            </div>

            {/* Modal: Create/Edit Page */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <CodeOutlined style={{ color: '#FFD700' }} />
                        <span className="text-white font-bold font-minecraft">
                            {editingPage ? 'Редактировать страницу' : 'Создать новую страницу'}
                        </span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
                className="custom-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleSavePage} className="pt-4">
                    <Form.Item name="title" label="Заголовок (Title)" rules={[{ required: true, message: 'Введите заголовок' }]}>
                        <Input placeholder="Например: Описание сборки модов" />
                    </Form.Item>
                    <Form.Item 
                        name="path" 
                        label="Путь в URL (Slug)" 
                        rules={[
                            { required: true, message: 'Введите путь' },
                            { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Только английские буквы, цифры, дефис и подчеркивание' }
                        ]}
                        extra="Страница будет доступна по адресу storylegends.xyz/ваша-страница"
                    >
                        <Input placeholder="mods-list" disabled={!!editingPage} />
                    </Form.Item>
                    <Form.Item name="htmlContent" label="HTML Содержимое страницы" rules={[{ required: true, message: 'Введите HTML-код' }]}>
                        <Input.TextArea 
                            rows={15} 
                            placeholder="<div><h1>Мой заголовок</h1><p>Текст...</p></div>" 
                            className="font-mono text-xs"
                        />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Отмена</Button>
                            <Button type="primary" htmlType="submit" className="bg-story-gold text-black border-none font-semibold">Сохранить</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PagesTab;

