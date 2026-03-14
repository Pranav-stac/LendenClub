import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  Users,
  User,
  Lock,
  Unlock,
  Settings,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  FileText,
  Folder,
  FolderOpen,
  Download,
  Trash2,
  Camera,
  Video,
  Paperclip,
  Check,
  X,
  Eye,
  Copy,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Rocket,
  Save,
  Search,
  Edit,
  Plus,
  Bell,
  Mail,
  Target,
  Star,
  Lightbulb,
  Zap,
  PartyPopper,
  Film,
  File,
  Bookmark,
  Clipboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X as XIcon,
  LogOut,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Gift,
  Play,
  HelpCircle,
  Smartphone,
} from 'lucide-react';

// Icon component that accepts a name and renders the appropriate icon
export interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  // Navigation
  '📊': LayoutDashboard,
  '📈': BarChart3,
  '📅': Calendar,
  '🖼️': ImageIcon,
  '👥': Users,
  '👤': User,
  '🔐': Lock,
  '⚙️': Settings,
  
  // Platforms
  '📸': Instagram,
  '📘': Facebook,
  '🐦': Twitter,
  '💼': Linkedin,
  '▶️': Play,
  '🎵': Music,
  
  // Files & Media
  '📄': FileText,
  '📁': Folder,
  '📂': FolderOpen,
  '📷': Camera,
  '🎬': Video,
  '📎': Paperclip,
  
  // Actions
  '⬇️': Download,
  '🗑️': Trash2,
  '✅': CheckCircle2,
  '✓': Check,
  '✗': X,
  '❌': X,
  '👁️': Eye,
  '📋': Clipboard,
  '🔍': Search,
  '✏️': Edit,
  '➕': Plus,
  '🔒': Lock,
  '🔓': Unlock,
  '💡': Lightbulb,
  '🚀': Rocket,
  '💾': Save,
  
  // Social
  '❤️': Heart,
  '💬': MessageCircle,
  
  // Status
  '📝': FileText,
  '📱': Smartphone,
  
  // Misc
  '📭': Mail,
  '🎯': Target,
  '⭐': Star,
  '🎉': PartyPopper,
  '📌': Bookmark,
  '🎭': HelpCircle,
  '🎪': HelpCircle,
  '🎨': Sparkles,
  '📉': TrendingDown,
  '💰': DollarSign,
  '💳': CreditCard,
  '🎁': Gift,
  '❓': HelpCircle,
  '↪': LogOut,
  '✕': XIcon,
};

// Platform icon mapping
export const PLATFORM_ICON_MAP: Record<string, React.ComponentType<any>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music,
};

export function Icon({ name, size = 20, className, style }: IconProps) {
  const IconComponent = iconMap[name] || iconMap['❓'];
  
  if (!IconComponent) {
    return <span style={{ fontSize: size, ...style }} className={className}>{name}</span>;
  }
  
  return (
    <IconComponent 
      size={typeof size === 'string' ? parseInt(size) : size} 
      className={className}
      style={style}
    />
  );
}

// Platform icon component
export function PlatformIcon({ 
  platformName, 
  size = 20, 
  className, 
  style 
}: { 
  platformName: string; 
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const normalizedName = platformName.toLowerCase();
  const IconComponent = PLATFORM_ICON_MAP[normalizedName] || LinkIcon;
  
  return (
    <IconComponent 
      size={typeof size === 'string' ? parseInt(size) : size} 
      className={className}
      style={style}
    />
  );
}

// Helper to get platform icon component
export function getPlatformIcon(platformName: string): React.ComponentType<any> {
  const normalizedName = platformName.toLowerCase();
  return PLATFORM_ICON_MAP[normalizedName] || LinkIcon;
}

