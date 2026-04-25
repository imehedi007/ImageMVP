"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExperienceContent } from "@/types";

interface AdminDashboardProps {
  initialAuthenticated: boolean;
}

interface DashboardOverview {
  totalUsers: number;
  totalVerifiedUsers: number;
  totalGenerations: number;
  todayGenerations: number;
}

interface DashboardSearchRow {
  userId: number;
  name: string;
  phone: string;
  age: number;
  totalGenerations: number;
  lastGeneratedAt: string | null;
  lastBike: string | null;
  lastEnvironment: string | null;
}

interface RecentGenerationRow {
  name: string;
  phone: string;
  age: number;
  bikeType: string;
  environment: string;
  status: string;
  provider: string;
  errorMessage: string | null;
  createdAt: string;
}

interface PaginatedUserRow {
  userId: number;
  name: string;
  phone: string;
  age: number;
  totalGenerations: number;
  lastGeneratedAt: string | null;
}

interface UserDetailPayload {
  user: {
    id: number;
    name: string;
    phone: string;
    age: number;
    otpVerifiedAt: string | null;
    createdAt: string;
  };
  logs: Array<{
    id: number;
    bikeType: string;
    environment: string;
    status: string;
    provider: string;
    errorMessage: string | null;
    createdAt: string;
  }>;
}

type AdminTab = "overview" | "users" | "bikes" | "environments" | "settings";

const emptyContent: ExperienceContent = {
  hero: {
    eyebrow: "",
    title: "",
    description: "",
    highlights: [],
    viralityTitle: "",
    viralityDescription: ""
  },
  settings: {
    companionMode: "friend",
    defaultAgeRange: "18-24",
    defaultVibe: "Playful",
    defaultFavoriteColor: "#FF6B35",
    helmetRequired: true,
    poseDirection: "",
    cameraFrame: "",
    poseVariants: [],
    wardrobeDirection: "",
    realismDirection: ""
  },
  bikes: [],
  environments: [],
  colors: [],
  behaviorQuestion: {
    title: "",
    description: "",
    options: []
  }
};

const navItems: Array<{ id: AdminTab; label: string; hint: string }> = [
  { id: "overview", label: "Overview", hint: "Stats & activity" },
  { id: "users", label: "Users", hint: "Phone search" },
  { id: "bikes", label: "Bikes", hint: "Bike content" },
  { id: "environments", label: "Env", hint: "Scene content" },
  { id: "settings", label: "Settings", hint: "Prompt config" }
];

function formatAdminDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka"
  })
    .format(parsed)
    .replace(",", " ·");
}

export function AdminDashboard({ initialAuthenticated }: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [content, setContent] = useState<ExperienceContent>(emptyContent);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [statsLoading, setStatsLoading] = useState(initialAuthenticated);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [overview, setOverview] = useState<DashboardOverview>({
    totalUsers: 0,
    totalVerifiedUsers: 0,
    totalGenerations: 0,
    todayGenerations: 0
  });
  const [searchResults, setSearchResults] = useState<DashboardSearchRow[]>([]);
  const [recentRows, setRecentRows] = useState<RecentGenerationRow[]>([]);
  const [usersRows, setUsersRows] = useState<PaginatedUserRow[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageCount, setUsersPageCount] = useState(1);
  const [usersLoading, setUsersLoading] = useState(initialAuthenticated);
  const [userDetail, setUserDetail] = useState<UserDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportPageCount, setExportPageCount] = useState(1);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    void loadContent();
    void loadStats();
    void loadUsersPage(1);
  }, [authenticated]);

  async function loadContent() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/content");

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }

        throw new Error("Failed to load dashboard content.");
      }

      const data = (await response.json()) as ExperienceContent;
      setContent(data);
    } catch (issue) {
      console.error(issue);
      setError("Could not load admin content.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(phone = "") {
    try {
      setStatsLoading(true);
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : "";
      const response = await fetch(`/api/admin/stats${query}`);

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }

        throw new Error("Failed to load dashboard stats.");
      }

      const data = (await response.json()) as {
        overview: DashboardOverview;
        searchResults: DashboardSearchRow[];
        recentRows: RecentGenerationRow[];
        exportPageCount: number;
      };

      setOverview(data.overview);
      setSearchResults(data.searchResults);
      setRecentRows(data.recentRows);
      setExportPageCount(data.exportPageCount || 1);
    } catch (issue) {
      console.error(issue);
      setError("Could not load admin stats.");
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadUsersPage(page: number) {
    try {
      setUsersLoading(true);
      const response = await fetch(`/api/admin/users?page=${page}&limit=15`);

      if (!response.ok) {
        throw new Error("Failed to load users.");
      }

      const data = (await response.json()) as {
        rows: PaginatedUserRow[];
        page: number;
        pageCount: number;
      };

      setUsersRows(data.rows);
      setUsersPage(data.page);
      setUsersPageCount(data.pageCount);
    } catch (issue) {
      console.error(issue);
      setError("Could not load paginated users.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function openUserDetail(userId: number) {
    try {
      setDetailLoading(true);
      setUserDetail(null);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to load user detail.");
      }

      const data = (await response.json()) as UserDetailPayload;
      setUserDetail(data);
    } catch (issue) {
      console.error(issue);
      setError("Could not load user detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleLogin() {
    try {
      setError("");
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      setAuthenticated(true);
      setPassword("");
      setSuccess("Logged in successfully.");
    } catch (issue) {
      console.error(issue);
      setError("Login failed. Check admin username and password.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setContent(emptyContent);
    setSuccess("");
    setActiveTab("overview");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message || "Save failed.");
      }

      setSuccess("Dashboard content saved.");
    } catch (issue) {
      console.error(issue);
      setError(issue instanceof Error ? issue.message : "Could not save content.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch() {
    await loadStats(searchPhone);
    setActiveTab("users");
  }

  function updateHero<K extends keyof ExperienceContent["hero"]>(key: K, value: ExperienceContent["hero"][K]) {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [key]: value
      }
    }));
  }

  function updateSettings<K extends keyof ExperienceContent["settings"]>(
    key: K,
    value: ExperienceContent["settings"][K]
  ) {
    setContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value
      }
    }));
  }

  function updateListItem<T>(list: T[], index: number, value: T) {
    return list.map((item, itemIndex) => (itemIndex === index ? value : item));
  }

  if (!authenticated) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[36px] border border-white/10 bg-[#091222] p-8 text-white shadow-[0_30px_80px_rgba(1,8,20,0.55)]">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-[#8f96ff]/20 bg-[#8f96ff]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8adff]">
            Owner Access
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Yamaha AI dashboard</h1>
          <p className="text-sm leading-7 text-white/60">
            Sign in to see stats, search users, export CSV, and manage bikes plus environment content.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <Field label="Username">
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button className="w-full" onClick={handleLogin}>
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[36px] border border-white/10 bg-[#091222] p-8 text-white shadow-[0_30px_80px_rgba(1,8,20,0.55)]">
        <div className="h-8 w-56 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-white/5" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-[28px] bg-white/5" />
          <div className="h-40 animate-pulse rounded-[28px] bg-white/5" />
          <div className="h-40 animate-pulse rounded-[28px] bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-[32px] border border-white/10 bg-[#091222] p-5 text-white shadow-[0_30px_80px_rgba(1,8,20,0.45)] lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-y-auto">
        <div className="border-b border-white/10 pb-5">
          <span className="inline-flex rounded-full border border-[#8f96ff]/20 bg-[#8f96ff]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8adff]">
            Owner panel
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Yamaha AI Admin</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">Stats, users, bike cards, environment content, and prompt settings.</p>
        </div>

        <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-start justify-between rounded-[20px] px-4 py-3 text-left transition ${
                activeTab === item.id
                  ? "bg-[#8f96ff]/15 text-white shadow-[inset_0_0_0_1px_rgba(143,150,255,0.22)]"
                  : "bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="mt-1 text-xs text-white/45">{item.hint}</div>
              </div>
              <span className="text-white/35">→</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <a
            href={`/api/admin/export?page=1`}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Export CSV 1
          </a>
          <Button variant="dark" className="w-full" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>

      <main className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-[#091222] p-6 text-white shadow-[0_30px_80px_rgba(1,8,20,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                {navItems.find((item) => item.id === activeTab)?.label}
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {activeTab === "overview" && "Business overview"}
                {activeTab === "users" && "User lookup"}
                {activeTab === "bikes" && "Bike manager"}
                {activeTab === "environments" && "Environment manager"}
                {activeTab === "settings" && "Experience settings"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                {activeTab === "overview" && "See total traffic, generation trends, recent activity, and export the whole dataset."}
                {activeTab === "users" && "Search any phone number and inspect how many times that user generated images."}
                {activeTab === "bikes" && "Maintain bike cards and the data used in the public bike selection step."}
                {activeTab === "environments" && "Update environment cards, labels, descriptions, and scene direction text."}
                {activeTab === "settings" && "Edit prompt defaults, hero copy, behavior content, and generation settings."}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        {activeTab === "overview" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total users" value={String(overview.totalUsers)} />
              <StatCard label="Verified users" value={String(overview.totalVerifiedUsers)} />
              <StatCard label="Total generations" value={String(overview.totalGenerations)} />
              <StatCard label="Today generations" value={String(overview.todayGenerations)} />
            </div>

            <Panel title="Quick search">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={searchPhone}
                  onChange={(event) => setSearchPhone(event.target.value)}
                  placeholder="Search by phone number"
                  className="md:flex-1"
                />
                <Button onClick={handleSearch} disabled={statsLoading}>
                  {statsLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </Panel>

            <Panel title="Recent activity" noPadding>
              <DataTable
                headers={["Name", "Phone", "Bike", "Environment", "Status", "Time"]}
                rows={recentRows.map((row, index) => [
                  `${row.name}-${index}`,
                  row.name,
                  row.phone,
                  row.bikeType,
                  row.environment,
                  row.status,
                  formatAdminDateTime(row.createdAt)
                ])}
                emptyMessage="No recent activity found."
              />
            </Panel>
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="space-y-6">
            <Panel title="Search by phone">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={searchPhone}
                  onChange={(event) => setSearchPhone(event.target.value)}
                  placeholder="8801xxxxxxxxx"
                  className="md:flex-1"
                />
                <Button onClick={handleSearch} disabled={statsLoading}>
                  {statsLoading ? "Searching..." : "Search user"}
                </Button>
              </div>
            </Panel>

            <Panel title="Search result" noPadding>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/60">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Age</th>
                      <th className="px-5 py-3 font-medium">Generations</th>
                      <th className="px-5 py-3 font-medium">Last bike</th>
                      <th className="px-5 py-3 font-medium">Last env</th>
                      <th className="px-5 py-3 font-medium">Last generated</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length ? (
                      searchResults.map((row) => (
                        <tr key={row.userId} className="border-t border-white/10">
                          <td className="px-5 py-3">{row.name}</td>
                          <td className="px-5 py-3">{row.phone}</td>
                          <td className="px-5 py-3">{row.age}</td>
                          <td className="px-5 py-3">{row.totalGenerations}</td>
                          <td className="px-5 py-3">{row.lastBike || "-"}</td>
                          <td className="px-5 py-3">{row.lastEnvironment || "-"}</td>
                          <td className="px-5 py-3">{formatAdminDateTime(row.lastGeneratedAt)}</td>
                          <td className="px-5 py-3">
                            <Button variant="secondary" className="px-4 py-2" onClick={() => void openUserDetail(row.userId)}>
                              Watch
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-white/10">
                        <td colSpan={8} className="px-5 py-6 text-center text-white/45">
                          {searchPhone ? "No user found for this number." : "Search a number to see image generation history."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="All users" noPadding>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/60">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Age</th>
                      <th className="px-5 py-3 font-medium">Generations</th>
                      <th className="px-5 py-3 font-medium">Last generated</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr className="border-t border-white/10">
                        <td colSpan={6} className="px-5 py-8 text-center text-white/45">
                          Loading users...
                        </td>
                      </tr>
                    ) : usersRows.length ? (
                      usersRows.map((row) => (
                        <tr key={row.userId} className="border-t border-white/10">
                          <td className="px-5 py-3">{row.name}</td>
                          <td className="px-5 py-3">{row.phone}</td>
                          <td className="px-5 py-3">{row.age}</td>
                          <td className="px-5 py-3">{row.totalGenerations}</td>
                          <td className="px-5 py-3">{formatAdminDateTime(row.lastGeneratedAt)}</td>
                          <td className="px-5 py-3">
                            <Button variant="secondary" className="px-4 py-2" onClick={() => void openUserDetail(row.userId)}>
                              Watch
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-white/10">
                        <td colSpan={6} className="px-5 py-8 text-center text-white/45">
                          No users found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                <Button variant="dark" disabled={usersPage <= 1} onClick={() => void loadUsersPage(usersPage - 1)}>
                  Prev
                </Button>
                <div className="text-sm text-white/60">
                  Page {usersPage} of {usersPageCount}
                </div>
                <Button
                  variant="secondary"
                  disabled={usersPage >= usersPageCount}
                  onClick={() => void loadUsersPage(usersPage + 1)}
                >
                  Next
                </Button>
              </div>
            </Panel>

            <Panel title="CSV export pages">
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: exportPageCount }, (_, index) => index + 1).map((page) => (
                  <a
                    key={page}
                    href={`/api/admin/export?page=${page}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Export {page}
                  </a>
                ))}
              </div>
            </Panel>
          </div>
        ) : null}

        {activeTab === "bikes" ? (
          <Panel title="Bike card manager">
            <div className="space-y-4">
              {content.bikes.map((bike, index) => (
                <EditorCard key={bike.id || index} title={bike.name || `Bike ${index + 1}`}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Bike ID">
                      <Input
                        value={bike.id}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            bikes: updateListItem(current.bikes, index, { ...bike, id: event.target.value })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Bike name">
                      <Input
                        value={bike.name}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            bikes: updateListItem(current.bikes, index, { ...bike, name: event.target.value })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Image path">
                      <Input
                        value={bike.image}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            bikes: updateListItem(current.bikes, index, { ...bike, image: event.target.value })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className={editorTextAreaClass}
                        value={bike.description}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            bikes: updateListItem(current.bikes, index, { ...bike, description: event.target.value })
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Button
                    className="mt-4"
                    variant="dark"
                    onClick={() =>
                      setContent((current) => ({
                        ...current,
                        bikes: current.bikes.filter((_, bikeIndex) => bikeIndex !== index)
                      }))
                    }
                  >
                    Remove bike
                  </Button>
                </EditorCard>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  setContent((current) => ({
                    ...current,
                    bikes: [
                      ...current.bikes,
                      {
                        id: `bike-${current.bikes.length + 1}`,
                        name: "New Bike",
                        description: "Describe the bike.",
                        image: "/bikes/neo-cafe.svg"
                      }
                    ]
                  }))
                }
              >
                Add bike
              </Button>
            </div>
          </Panel>
        ) : null}

        {activeTab === "environments" ? (
          <Panel title="Environment manager">
            <div className="space-y-4">
              {content.environments.map((environment, index) => (
                <EditorCard key={environment.id || index} title={environment.label || `Environment ${index + 1}`}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Environment ID">
                      <Input
                        value={environment.id}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            environments: updateListItem(current.environments, index, {
                              ...environment,
                              id: event.target.value as typeof environment.id
                            })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Label">
                      <Input
                        value={environment.label}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            environments: updateListItem(current.environments, index, {
                              ...environment,
                              label: event.target.value
                            })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className={editorTextAreaClass}
                        value={environment.description}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            environments: updateListItem(current.environments, index, {
                              ...environment,
                              description: event.target.value
                            })
                          }))
                        }
                      />
                    </Field>
                    <Field label="Scene direction">
                      <textarea
                        className={editorTextAreaClass}
                        value={environment.sceneDirection}
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            environments: updateListItem(current.environments, index, {
                              ...environment,
                              sceneDirection: event.target.value
                            })
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Button
                    className="mt-4"
                    variant="dark"
                    onClick={() =>
                      setContent((current) => ({
                        ...current,
                        environments: current.environments.filter((_, itemIndex) => itemIndex !== index)
                      }))
                    }
                  >
                    Remove environment
                  </Button>
                </EditorCard>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  setContent((current) => ({
                    ...current,
                    environments: [
                      ...current.environments,
                      {
                        id: "city",
                        label: "New Environment",
                        description: "Describe the place.",
                        image: "",
                        sceneDirection: "Describe the cinematic scene direction."
                      }
                    ]
                  }))
                }
              >
                Add environment
              </Button>
            </div>
          </Panel>
        ) : null}

        {activeTab === "settings" ? (
          <div className="space-y-6">
            <Panel title="Hero copy">
              <div className="grid gap-4">
                <Field label="Eyebrow">
                  <Input value={content.hero.eyebrow} onChange={(event) => updateHero("eyebrow", event.target.value)} />
                </Field>
                <Field label="Title">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.hero.title}
                    onChange={(event) => updateHero("title", event.target.value)}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.hero.description}
                    onChange={(event) => updateHero("description", event.target.value)}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Prompt settings">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Companion mode">
                  <select
                    className={editorSelectClass}
                    value={content.settings.companionMode}
                    onChange={(event) => updateSettings("companionMode", event.target.value as "friend" | "solo")}
                  >
                    <option value="friend">Friend</option>
                    <option value="solo">Solo</option>
                  </select>
                </Field>
                <Field label="Default age range">
                  <Input
                    value={content.settings.defaultAgeRange}
                    onChange={(event) => updateSettings("defaultAgeRange", event.target.value)}
                  />
                </Field>
                <Field label="Default vibe">
                  <Input
                    value={content.settings.defaultVibe}
                    onChange={(event) => updateSettings("defaultVibe", event.target.value)}
                  />
                </Field>
                <Field label="Default favorite color">
                  <Input
                    value={content.settings.defaultFavoriteColor}
                    onChange={(event) => updateSettings("defaultFavoriteColor", event.target.value)}
                  />
                </Field>
                <Field label="Helmet required">
                  <select
                    className={editorSelectClass}
                    value={content.settings.helmetRequired ? "true" : "false"}
                    onChange={(event) => updateSettings("helmetRequired", event.target.value === "true")}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </Field>
                <Field label="Pose variants">
                  <ArrayEditor
                    items={content.settings.poseVariants}
                    onChange={(items) => updateSettings("poseVariants", items)}
                    addLabel="Add pose variant"
                  />
                </Field>
                <Field label="Pose direction">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.settings.poseDirection}
                    onChange={(event) => updateSettings("poseDirection", event.target.value)}
                  />
                </Field>
                <Field label="Camera frame">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.settings.cameraFrame}
                    onChange={(event) => updateSettings("cameraFrame", event.target.value)}
                  />
                </Field>
                <Field label="Wardrobe direction">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.settings.wardrobeDirection}
                    onChange={(event) => updateSettings("wardrobeDirection", event.target.value)}
                  />
                </Field>
                <Field label="Realism direction">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.settings.realismDirection}
                    onChange={(event) => updateSettings("realismDirection", event.target.value)}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Behavior question">
              <div className="grid gap-4">
                <Field label="Question title">
                  <Input
                    value={content.behaviorQuestion.title}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        behaviorQuestion: {
                          ...current.behaviorQuestion,
                          title: event.target.value
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Question description">
                  <textarea
                    className={editorTextAreaClass}
                    value={content.behaviorQuestion.description}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        behaviorQuestion: {
                          ...current.behaviorQuestion,
                          description: event.target.value
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Color presets">
                  <ArrayEditor
                    items={content.colors}
                    onChange={(items) =>
                      setContent((current) => ({
                        ...current,
                        colors: items
                      }))
                    }
                    addLabel="Add color"
                  />
                </Field>
              </div>
            </Panel>
          </div>
        ) : null}
      </main>

      {userDetail || detailLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020814]/80 p-4 backdrop-blur-sm">
          <div className="max-h-[85svh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#091222] p-6 text-white shadow-[0_30px_80px_rgba(1,8,20,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-white/45">User details</div>
                <h3 className="mt-2 text-2xl font-semibold">
                  {detailLoading ? "Loading..." : userDetail?.user.name || "User"}
                </h3>
              </div>
              <button
                type="button"
                className="text-white/60"
                onClick={() => {
                  setUserDetail(null);
                  setDetailLoading(false);
                }}
              >
                ✕
              </button>
            </div>

            {userDetail ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="User ID" value={String(userDetail.user.id)} />
                  <InfoBlock label="Total generations" value={String(userDetail.logs.length)} />
                  <InfoBlock label="Phone" value={userDetail.user.phone} />
                  <InfoBlock label="Age" value={String(userDetail.user.age)} />
                  <InfoBlock label="OTP verified" value={formatAdminDateTime(userDetail.user.otpVerifiedAt)} />
                  <InfoBlock label="Created" value={formatAdminDateTime(userDetail.user.createdAt)} />
                </div>

                <div className="overflow-hidden rounded-[24px] border border-white/10">
                  <div className="border-b border-white/10 px-5 py-4 text-sm font-semibold">Generation logs</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          <th className="px-5 py-3 font-medium">Bike</th>
                          <th className="px-5 py-3 font-medium">Environment</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Provider</th>
                          <th className="px-5 py-3 font-medium">Error</th>
                          <th className="px-5 py-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetail.logs.length ? (
                          userDetail.logs.map((log) => (
                            <tr key={log.id} className="border-t border-white/10">
                              <td className="px-5 py-3">{log.bikeType}</td>
                              <td className="px-5 py-3">{log.environment}</td>
                              <td className="px-5 py-3">{log.status}</td>
                              <td className="px-5 py-3">{log.provider || "-"}</td>
                              <td className="px-5 py-3 text-white/55">{log.errorMessage || "-"}</td>
                              <td className="px-5 py-3">{formatAdminDateTime(log.createdAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-t border-white/10">
                            <td colSpan={6} className="px-5 py-8 text-center text-white/45">
                              No generation logs for this user yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const editorTextAreaClass =
  "min-h-28 w-full rounded-[22px] border border-blue-400/14 bg-[linear-gradient(180deg,rgba(15,32,58,0.92),rgba(9,24,44,0.98))] px-4 py-3.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-slate-500 focus:border-blue-400/45 focus:ring-2 focus:ring-blue-500/15";

const editorSelectClass =
  "w-full rounded-[22px] border border-blue-400/14 bg-[linear-gradient(180deg,rgba(15,32,58,0.92),rgba(9,24,44,0.98))] px-4 py-3.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-blue-400/45 focus:ring-2 focus:ring-blue-500/15";

function Panel({
  title,
  children,
  noPadding = false
}: {
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#091222] text-white shadow-[0_30px_80px_rgba(1,8,20,0.4)]">
      <div className="border-b border-white/10 px-6 py-5">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </section>
  );
}

function EditorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 text-base font-semibold text-white">{title}</div>
      {children}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  emptyMessage
}: {
  headers: string[];
  rows: string[][];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row[0]} className="border-t border-white/10">
                {row.slice(1).map((value, index) => (
                  <td key={`${row[0]}-${index}`} className="px-5 py-3">
                    {value}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="border-t border-white/10">
              <td className="px-5 py-4 text-white/45" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#091222] px-5 py-5 text-white shadow-[0_20px_60px_rgba(1,8,20,0.35)]">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white/75">{label}</span>
      {children}
    </label>
  );
}

function ArrayEditor({
  items,
  onChange,
  addLabel
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex gap-3">
          <Input
            value={item}
            onChange={(event) =>
              onChange(items.map((currentItem, itemIndex) => (itemIndex === index ? event.target.value : currentItem)))
            }
          />
          <Button variant="dark" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, ""])}>
        {addLabel}
      </Button>
    </div>
  );
}
