import apiClient from './client';

export interface CustomPage {
  id: number;
  path: string;
  title: string;
  htmlContent: string;
  createdAt?: string;
  updatedAt?: string;
}

export const customPagesApi = {
  getMany: () => apiClient.get<CustomPage[]>('/api/admin/pages').then(res => res.data),
  getByPath: (path: string) => apiClient.get<CustomPage>(`/api/pages/${path}`).then(res => res.data),
  create: (data: Partial<CustomPage>) => apiClient.post<CustomPage>('/api/admin/pages', data).then(res => res.data),
  update: (id: number, data: Partial<CustomPage>) => apiClient.put<CustomPage>(`/api/admin/pages/${id}`, data).then(res => res.data),
  delete: (id: number) => apiClient.delete(`/api/admin/pages/${id}`).then(res => res.data),
};
