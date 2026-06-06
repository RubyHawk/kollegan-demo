import {
  BarChart2,
  Bed,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Folder,
  GripVertical,
  Home,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Pencil,
  Phone,
  PhoneOff,
  Plus,
  Receipt,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 16;
const DEFAULT_STROKE = 1.75;

function makeIcon(Icon: LucideIcon, defaultSize = DEFAULT_SIZE) {
  return function SharedLucideIcon({
    size = defaultSize,
    className,
    strokeWidth = DEFAULT_STROKE,
  }: IconProps) {
    return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden focusable={false} />;
  };
}

export const PhoneIcon = makeIcon(Phone);
export const PhoneOffIcon = makeIcon(PhoneOff);
export const CheckCircleIcon = makeIcon(CheckCircle);
export const XCircleIcon = makeIcon(XCircle);
export const LockIcon = makeIcon(Lock);
export const SearchIcon = makeIcon(Search);
export const UsersIcon = makeIcon(Users);
export const BedIcon = makeIcon(Bed);
export const BuildingIcon = makeIcon(Building);
export const BriefcaseIcon = makeIcon(Briefcase);
export const MapPinIcon = makeIcon(MapPin);
export const MenuIcon = makeIcon(Menu, 18);
export const InfoCircleIcon = makeIcon(Info);
export const CalendarIcon = makeIcon(Calendar);
export const ClockIcon = makeIcon(Clock);
export const UserIcon = makeIcon(User);
export const MailIcon = makeIcon(Mail);
export const CompanyIcon = makeIcon(Building2);
export const SparkleIcon = makeIcon(Sparkles);
export const NoteIcon = makeIcon(FileText);
export const ChevronRightIcon = makeIcon(ChevronRight);
export const ChevronLeftIcon = makeIcon(ChevronLeft);
export const ChevronDownIcon = makeIcon(ChevronDown);
export const SendIcon = makeIcon(Send);
export const ChatBubbleIcon = makeIcon(MessageSquare);
export const CloseIcon = makeIcon(X);
export const GripDotsIcon = makeIcon(GripVertical);
export const PlusIcon = makeIcon(Plus);
export const EditIcon = makeIcon(Pencil);
export const TrashIcon = makeIcon(Trash2);
export const SunIcon = makeIcon(Sun, 18);
export const MoonIcon = makeIcon(Moon, 18);
export const HomeIcon = makeIcon(Home);
export const SettingsIcon = makeIcon(Settings);
export const LogOutIcon = makeIcon(LogOut);
export const BarChart2Icon = makeIcon(BarChart2);
export const FileTextIcon = makeIcon(FileText);
export const ReceiptIcon = makeIcon(Receipt);
export const FolderIcon = makeIcon(Folder);
export const MessageSquareIcon = makeIcon(MessageSquare);
export const CreditCardIcon = makeIcon(CreditCard);
export const ShieldIcon = makeIcon(Shield);
export const PackageIcon = makeIcon(Package);
