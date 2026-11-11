import {
  BarChart3, Bot, Building2, CalendarRange, CheckSquare, FolderKanban, LayoutDashboard, Library, Scale, Settings,
} from "lucide-react";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Aufgaben", icon: CheckSquare },
  { href: "/projects", label: "Projekte", icon: FolderKanban },
  { href: "/departments", label: "Abteilungen", icon: Building2 },
  { href: "/research", label: "Research", icon: Library },
  { href: "/decisions", label: "Entscheidungen", icon: Scale },
  { href: "/agents", label: "Agenten", icon: Bot },
  { href: "/progress", label: "Fortschritt", icon: BarChart3 },
  { href: "/reports", label: "Wochenberichte", icon: CalendarRange },
  { href: "/settings", label: "Einstellungen", icon: Settings },
] as const;
