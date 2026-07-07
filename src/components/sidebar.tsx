"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  Building2,
  Shield,
  Settings,
  LogOut,
  TrendingUp,
  LineChart,
  CreditCard,
  PiggyBank,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavLink[];
}

type NavEntry =
  | ({ type: "link" } & NavLink & { icon: LucideIcon })
  | ({ type: "group" } & NavGroup);

const navEntries: NavEntry[] = [
  { type: "link", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { type: "link", href: "/transactions", label: "Transactions", icon: Receipt },
  { type: "link", href: "/accounts", label: "Accounts", icon: Landmark },
  { type: "link", href: "/investments", label: "Investments", icon: TrendingUp },
  { type: "link", href: "/assets", label: "Assets", icon: Building2 },
  {
    type: "group",
    label: "Credit Line",
    icon: CreditCard,
    children: [
      { href: "/loans", label: "Loans" },
      { href: "/credit-cards", label: "Credit Cards" },
      { href: "/overdraft", label: "Overdraft" },
    ],
  },
  {
    type: "group",
    label: "Retirement Plans",
    icon: PiggyBank,
    children: [
      { href: "/nps", label: "NPS" },
      { href: "/epf", label: "EPF" },
    ],
  },
  {
    type: "group",
    label: "Insurance",
    icon: Shield,
    children: [
      { href: "/insurance", label: "Insurance" },
      { href: "/term-policies", label: "Term Insurance" },
    ],
  },
  { type: "link", href: "/projection", label: "Projection", icon: LineChart },
  { type: "link", href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function isGroupActive(pathname: string, children: NavLink[]) {
  return children.some((child) => isActive(pathname, child.href));
}

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const entry of navEntries) {
      if (entry.type === "group" && isGroupActive(pathname, entry.children)) {
        next[entry.label] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <h1 className="text-lg font-bold">Finance Tracker</h1>
        <p className="text-xs text-muted-foreground">Personal expense & net worth</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navEntries.map((entry) => {
          if (entry.type === "link") {
            const Icon = entry.icon;
            const active = isActive(pathname, entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {entry.label}
              </Link>
            );
          }

          const Icon = entry.icon;
          const groupActive = isGroupActive(pathname, entry.children);
          const isOpen = openGroups[entry.label] ?? false;

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => toggleGroup(entry.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  groupActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                  {entry.children.map((child) => {
                    const childActive = isActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          childActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
