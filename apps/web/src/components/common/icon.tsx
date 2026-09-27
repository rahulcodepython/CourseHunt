import * as React from "react";
import {
  Activity,
  Sliders,
  SlidersHorizontal,
  Undo2,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Ban,
  Bell,
  Book,
  LayoutGrid,
  BarChart3,
  LineChart,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  Cpu,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  Globe,
  HardDrive,
  Heart,
  CircleHelp,
  Network,
  History,
  Home,
  Info,
  List,
  Lock,
  LogOut,
  Mail,
  Layers,
  Menu,
  MessageSquare,
  MessagesSquare,
  Moon,
  Pause,
  Pencil,
  Percent,
  Pin,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Ticket,
  Trash2,
  User,
  UserCheck,
  Users,
  Video,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";

export type IconProps = LucideProps;

function GoogleIcon(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size || 24}
      height={props.size || 24}
      fill="currentColor"
      {...props}
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

export type IconName =
  | "activity"
  | "adjustments"
  | "adjustments-horizontal"
  | "arrow-back-up"
  | "arrow-left"
  | "arrow-right"
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
  | "circle"
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
  | "heart"
  | "help-circle"
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
  | "send"
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
  | "video"
  | "wallet"
  | "world"
  | "x";

const iconRegistry: Record<IconName, React.ComponentType<LucideProps>> = {
  activity: Activity,
  adjustments: Sliders,
  "adjustments-horizontal": SlidersHorizontal,
  "arrow-back-up": Undo2,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-down": ArrowUpDown,
  ban: Ban,
  bell: Bell,
  book: Book,
  "brand-google": GoogleIcon,
  category: LayoutGrid,
  "chart-bar": BarChart3,
  "chart-line": LineChart,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  circle: Circle,
  clock: Clock,
  copy: Copy,
  cpu: Cpu,
  "credit-card": CreditCard,
  "currency-rupee": IndianRupee,
  dashboard: LayoutDashboard,
  database: Database,
  download: Download,
  "external-link": ExternalLink,
  eye: Eye,
  "file-text": FileText,
  filter: Filter,
  folder: Folder,
  globe: Globe,
  "hard-drive": HardDrive,
  heart: Heart,
  "help-circle": CircleHelp,
  hierarchy: Network,
  history: History,
  home: Home,
  "info-circle": Info,
  "layout-dashboard": LayoutDashboard,
  list: List,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  memory: Layers,
  menu: Menu,
  message: MessageSquare,
  messages: MessagesSquare,
  moon: Moon,
  pause: Pause,
  pencil: Pencil,
  percentage: Percent,
  pin: Pin,
  play: Play,
  plus: Plus,
  "receipt-refund": Receipt,
  refresh: RefreshCw,
  search: Search,
  send: Send,
  server: Server,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  "shopping-cart": ShoppingCart,
  star: Star,
  sun: Sun,
  ticket: Ticket,
  trash: Trash2,
  user: User,
  "user-check": UserCheck,
  users: Users,
  video: Video,
  wallet: Wallet,
  world: Globe,
  x: X,
};

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = iconRegistry[name];
  if (!Component) return null;
  return <Component {...props} />;
}
