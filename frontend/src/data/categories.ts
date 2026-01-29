import { CategoryInfo } from '../types';

export const categories: CategoryInfo[] = [
  {
    id: 'all',
    label: 'All Emails',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'inbox'
  },
  {
    id: 'suspension',
    label: 'Suspension / Disciplinary',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'alert-circle'
  },
  {
    id: 'fir',
    label: 'FIR / Arrest',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'shield-alert'
  },
  {
    id: 'semester',
    label: 'Semester / Examination',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'graduation-cap'
  },
  {
    id: 'miscellaneous',
    label: 'Miscellaneous',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: 'folder'
  }
];

export const getCategoryInfo = (categoryId: string): CategoryInfo => {
  return categories.find(cat => cat.id === categoryId) || categories[0];
};