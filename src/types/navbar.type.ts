import { LucideIcon } from "lucide-react";

interface User {
    name: string;
    email: string;
    avatar: string;
}

interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
}

interface NavGroup {
    title: string;
    children: NavItem[];
}

export interface NavbarDataType {
    navMain: NavGroup[];
}