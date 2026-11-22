"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Bell, Blocks, CalendarClock, Folder, LayoutDashboard, MessageCircle, MessageSquareHeart,
  Moon, Network, Search, Settings, Sun, Wand2, LogOut, User, CreditCard, Check,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { Popover } from "@/components/ui/Popover";
import { siteConfig } from "@/config/site";
import { useUI } from "./Providers";

const mainNav = [
  { href: "/", label: "Tree", icon: Network },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { href: "/files", label: "Files", icon: Folder },
];

const rightNav = [
  { href: "/integrations", label: "Integrations", icon: Blocks },
  { href: "/schedules", label: "Schedules", icon: CalendarClock },
  { href: "/skills", label: "Skills", icon: Wand2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopBar() {
  const pathname = usePathname();
  const { setPaletteOpen } = useUI();
  const [menu, setMenu] = useState<null | "notifications" | "feedback" | "account">(null);
  const close = () => setMenu(null);
  const toggle = (m: typeof menu) => setMenu((cur) => (cur === m ? null : m));
  const initials = siteConfig.user.firstName[0] + siteConfig.user.lastName[0];

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="relative flex h-full items-center px-4">
        <Link href="/" className="flex items-center text-fg">
          <Logo />
        </Link>

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {mainNav.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href} label={label}>
              <Link href={href} className="icon-btn" data-active={isActive(pathname, href)} aria-label={label}>
                <Icon size={17} strokeWidth={1.7} />
              </Link>
            </Tooltip>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip label="Search  ⌘K">
            <button className="icon-btn" onClick={() => setPaletteOpen(true)} aria-label="Search">
              <Search size={17} strokeWidth={1.7} />
            </button>
          </Tooltip>

          <div className="relative">
            <Tooltip label="Notifications">
              <button className="icon-btn" data-active={menu === "notifications"} onClick={() => toggle("notifications")} aria-label="Notifications">
                <Bell size={17} strokeWidth={1.7} />
              </button>
            </Tooltip>
            <Popover open={menu === "notifications"} onClose={close} className="w-80">
              <NotificationsPanel />
            </Popover>
          </div>

          <div className="relative">
            <Tooltip label="Send Feedback">
              <button className="icon-btn" data-active={menu === "feedback"} onClick={() => toggle("feedback")} aria-label="Send Feedback">
                <MessageSquareHeart size={17} strokeWidth={1.7} />
              </button>
            </Tooltip>
            <Popover open={menu === "feedback"} onClose={close} className="w-80">
              <FeedbackPanel onDone={close} />
            </Popover>
          </div>

          <ThemeToggle />

          <span className="mx-1.5 h-5 w-px bg-line" />

          {rightNav.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href} label={label}>
              <Link href={href} className="icon-btn" data-active={isActive(pathname, href)} aria-label={label}>
                <Icon size={17} strokeWidth={1.7} />
              </Link>
            </Tooltip>
          ))}

          <div className="relative ml-1.5">
            <button
              onClick={() => toggle("account")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7cc4ff] via-[#b98bff] to-[#ff6b8b] text-[11px] font-semibold text-[#0b0b10] ring-1 ring-line"
              aria-label="Account"
            >
              {initials}
            </button>
            <Popover open={menu === "account"} onClose={close} className="w-64">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{siteConfig.user.firstName} {siteConfig.user.lastName}</div>
                <div className="text-xs text-muted">{siteConfig.user.email}</div>
              </div>
              <div className="my-1 h-px bg-line" />
              {[
                { label: "Profile", icon: User, href: "/settings" },
                { label: "Billing", icon: CreditCard, href: "/ready" },
                { label: "Settings", icon: Settings, href: "/settings" },
              ].map(({ label, icon: Icon, href }) => (
                <Link key={label} href={href} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-hover hover:text-fg">
                  <Icon size={15} /> {label}
                </Link>
              ))}
              <div className="my-1 h-px bg-line" />
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-hover hover:text-fg">
                <LogOut size={15} /> Log out
              </button>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const dark = !mounted || resolvedTheme === "dark";
  return (
    <Tooltip label={dark ? "Light mode" : "Dark mode"}>
      <button className="icon-btn" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Toggle theme">
        {dark ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
      </button>
    </Tooltip>
  );
}

const notifications = [
  { title: "Paid Ads needs you", body: "Cost per lead rose 7.7% this week.", time: "5 min ago", color: "#b98bff" },
  { title: "Q3 preview drafted", body: "Research finished the Volvo Cars preview.", time: "1 h ago", color: "#7cc4ff" },
  { title: "Invoice overdue", body: "Finance flagged 2 unpaid commissioned-research invoices.", time: "Yesterday", color: "#5fe08a" },
];

function NotificationsPanel() {
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium">Notifications</span>
        <button className="text-xs text-muted hover:text-fg">Mark all read</button>
      </div>
      {notifications.map((n) => (
        <div key={n.title} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-hover">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.color }} />
          <div className="min-w-0">
            <div className="text-[13px] font-medium">{n.title}</div>
            <div className="text-xs text-muted">{n.body}</div>
            <div className="mt-0.5 text-[11px] text-faint">{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackPanel({ onDone }: { onDone: () => void }) {
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");
  if (sent)
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <Check size={20} className="text-finance" />
        <div className="text-sm">Thanks! We read every message.</div>
      </div>
    );
  return (
    <form
      className="p-1"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
        setTimeout(onDone, 1400);
      }}
    >
      <div className="px-2 pb-2 pt-1 text-sm font-medium">Send feedback</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What should we improve?"
        className="w-full resize-none rounded-xl border border-line bg-hover p-3 text-sm outline-none placeholder:text-faint focus:border-fg/20"
      />
      <div className="mt-2 flex justify-end">
        <button disabled={!text.trim()} className="btn btn-cta h-8 disabled:opacity-40">Send</button>
      </div>
    </form>
  );
}
