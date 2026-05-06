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
  getMany: () => apiClient.get<CustomPage[]>('/admin/pages').then(res => res.data),
  getByPath: (path: string) => apiClient.get<CustomPage>(`/pages/${path}`).then(res => res.data),
  create: (data: Partial<CustomPage>) => apiClient.post<CustomPage>('/admin/pages', data).then(res => res.data),
  update: (id: number, data: Partial<CustomPage>) => apiClient.put<CustomPage>(`/admin/pages/${id}`, data).then(res => res.data),
  delete: (id: number) => apiClient.delete(`/admin/pages/${id}`).then(res => res.data),
};
