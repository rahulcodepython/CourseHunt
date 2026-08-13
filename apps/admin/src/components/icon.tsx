import * as React from "react";
import {
  IconActivity,
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconArrowLeft,
  IconBan,
  IconBell,
  IconBook,
  IconBrandGoogle,
  IconCategory,
  IconChartBar,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClock,
  IconCopy,
  IconCpu,
  IconCreditCard,
  IconCurrencyRupee,
  IconDashboard,
  IconDatabase,
  IconDeviceFloppy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFileText,
  IconFilter,
  IconFolder,
  IconGlobe,
  IconHierarchy,
  IconHistory,
  IconHome,
  IconInfoCircle,
  IconLayoutDashboard,
  IconList,
  IconLock,
  IconLogout,
  IconMail,
  IconMenu,
  IconMessage,
  IconMessages,
  IconMoon,
  IconPlayerPause,
  IconPencil,
  IconPercentage,
  IconPin,
  IconPlayerPlay,
  IconPlus,
  IconReceiptRefund,
  IconRefresh,
  IconSearch,
  IconSelector,
  IconServer,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconShoppingCart,
  IconStack2,
  IconStar,
  IconSun,
  IconTicket,
  IconTrash,
  IconUser,
  IconUserCheck,
  IconUsers,
  IconWallet,
  IconWorld,
  IconX,
  type IconProps,
} from "@tabler/icons-react";

export type IconName =
  | "activity"
  | "adjustments"
  | "adjustments-horizontal"
  | "arrow-back-up"
  | "arrow-left"
  | "arrow-up-down"
  | "ban"
  | "bell"
  | "book"
  | "brand-google"
  | "category"
  | "chart-bar"
  | "chart-line"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "clock"
  | "copy"
  | "cpu"
  | "credit-card"
  | "currency-rupee"
  | "dashboard"
  | "database"
  | "download"
  | "external-link"
  | "eye"
  | "file-text"
  | "filter"
  | "folder"
  | "globe"
  | "hard-drive"
  | "hierarchy"
  | "history"
  | "home"
  | "info-circle"
  | "layout-dashboard"
  | "list"
  | "lock"
  | "logout"
  | "mail"
  | "memory"
  | "menu"
  | "message"
  | "messages"
  | "moon"
  | "pause"
  | "pencil"
  | "percentage"
  | "pin"
  | "play"
  | "plus"
  | "receipt-refund"
  | "refresh"
  | "search"
  | "server"
  | "settings"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "star"
  | "sun"
  | "ticket"
  | "trash"
  | "user"
  | "user-check"
  | "users"
  | "wallet"
  | "world"
  | "x";

const iconRegistry: Record<IconName, React.ComponentType<IconProps>> = {
  activity: IconActivity,
  adjustments: IconAdjustments,
  "adjustments-horizontal": IconAdjustmentsHorizontal,
  "arrow-back-up": IconArrowBackUp,
  "arrow-left": IconArrowLeft,
  "arrow-up-down": IconSelector,
  ban: IconBan,
  bell: IconBell,
  book: IconBook,
  "brand-google": IconBrandGoogle,
  category: IconCategory,
  "chart-bar": IconChartBar,
  "chart-line": IconChartLine,
  check: IconCheck,
  "chevron-down": IconChevronDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  "chevron-up": IconChevronUp,
  clock: IconClock,
  copy: IconCopy,
  cpu: IconCpu,
  "credit-card": IconCreditCard,
  "currency-rupee": IconCurrencyRupee,
  dashboard: IconDashboard,
  database: IconDatabase,
  download: IconDownload,
  "external-link": IconExternalLink,
  eye: IconEye,
  "file-text": IconFileText,
  filter: IconFilter,
  folder: IconFolder,
  globe: IconGlobe,
  "hard-drive": IconDeviceFloppy,
  hierarchy: IconHierarchy,
  history: IconHistory,
  home: IconHome,
  "info-circle": IconInfoCircle,
  "layout-dashboard": IconLayoutDashboard,
  list: IconList,
  lock: IconLock,
  logout: IconLogout,
  mail: IconMail,
  "memory": IconStack2,
  menu: IconMenu,
  message: IconMessage,
  messages: IconMessages,
  moon: IconMoon,
  pause: IconPlayerPause,
  pencil: IconPencil,
  percentage: IconPercentage,
  pin: IconPin,
  play: IconPlayerPlay,
  plus: IconPlus,
  "receipt-refund": IconReceiptRefund,
  refresh: IconRefresh,
  search: IconSearch,
  server: IconServer,
  settings: IconSettings,
  shield: IconShield,
  "shield-check": IconShieldCheck,
  "shopping-cart": IconShoppingCart,
  star: IconStar,
  sun: IconSun,
  ticket: IconTicket,
  trash: IconTrash,
  user: IconUser,
  "user-check": IconUserCheck,
  users: IconUsers,
  wallet: IconWallet,
  world: IconWorld,
  x: IconX,
};

export function Icon({
  name,
  ...props
}: { name: IconName } & IconProps) {
  const Component = iconRegistry[name];
  if (!Component) return null;
  return <Component {...props} />;
}
