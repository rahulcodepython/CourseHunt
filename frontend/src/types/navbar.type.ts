import { ReactNode } from 'react';
import type { TablerIcon } from '@tabler/icons-react';

interface NavItem {
    title: string;
    url: string;
    icon?: React.ElementType | TablerIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
}

export interface NavGroupType {
    title: string;
    children: NavItem[];
}

export interface NavbarDataType {
    navMain: NavGroupType[];
}