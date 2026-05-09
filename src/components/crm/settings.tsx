"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  Users,
  Tag,
  Briefcase,
  Target,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Upload,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface SettingItem {
  key: string;
  value: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Member" | "Viewer";
  active: boolean;
  createdAt?: string;
}

interface ThematicArea {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface Service {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface MonthlyOverride {
  month: number;
  amount: number;
}

interface ServiceTarget {
  serviceId: string;
  serviceName: string;
  annualTarget: number;
  showMonthly: boolean;
  monthlyOverrides: MonthlyOverride[];
}

interface YearTarget {
  year: number;
  annualTarget: number;
  monthlyOverrides: MonthlyOverride[];
  serviceTargets: ServiceTarget[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Manager: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Member: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  Viewer: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
};

function formatPKR(value: number): string {
  return `₨ ${value.toLocaleString()}`;
}

// ──────────────────────────────────────────────
// Sortable Item Component (for Thematic Areas & Services)
// ──────────────────────────────────────────────

interface SortableItemProps {
  id: string;
  color: string;
  name: string;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditNameChange: (val: string) => void;
  onEditColorChange: (val: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function SortableItem({
  id,
  color,
  name,
  isEditing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      {isEditing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="color"
            value={editColor}
            onChange={(e) => onEditColorChange(e.target.value)}
            className="size-8 cursor-pointer rounded border p-0.5"
          />
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="h-8 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={onSave} className="h-8 px-2 text-emerald-600">
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 px-2 text-muted-foreground">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <span
            className="size-4 shrink-0 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <span className="flex-1 font-medium">{name}</span>
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-8 px-2">
            <Pencil className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 px-2 text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Company Branding Tab
// ──────────────────────────────────────────────

function CompanyBrandingTab() {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = React.useState("");
  const [companyLogo, setCompanyLogo] = React.useState("");
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const { data: settings, isLoading } = useQuery<SettingItem[]>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  React.useEffect(() => {
    if (settings) {
      const nameSetting = settings.find((s) => s.key === "companyName");
      const logoSetting = settings.find((s) => s.key === "companyLogo");
      if (nameSetting) setCompanyName(nameSetting.value);
      if (logoSetting) {
        setCompanyLogo(logoSetting.value);
        setLogoPreview(logoSetting.value);
      }
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (items: SettingItem[]) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Company branding saved successfully");
    },
    onError: () => {
      toast.error("Failed to save company branding");
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCompanyLogo(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveMutation.mutate([
      { key: "companyName", value: companyName },
      { key: "companyLogo", value: companyLogo },
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company name and logo. Changes will reflect across the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="relative flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("logoUpload")?.click()}
                    className="gap-2"
                  >
                    <Upload className="size-4" />
                    Upload Logo
                  </Button>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCompanyLogo("");
                        setLogoPreview(null);
                      }}
                      className="text-muted-foreground"
                    >
                      <X className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  PNG, JPG, or SVG. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {logoPreview && (
            <div className="space-y-2">
              <Label>Logo Preview</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                <img
                  src={logoPreview}
                  alt="Company logo preview"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2 min-w-[120px]">
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Team Management Tab
// ──────────────────────────────────────────────

function TeamManagementTab() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = React.useState<TeamMember | null>(null);

  // Form state
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formRole, setFormRole] = React.useState<string>("Member");
  const [formPassword, setFormPassword] = React.useState("");

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("Member");
    setFormPassword("");
  };

  const { data: team = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to fetch team");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string; password: string }) => {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add team member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team member added successfully");
      setAddOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to add team member"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; email: string; role: string; password?: string }) => {
      const res = await fetch(`/api/team?id=${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update team member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team member updated successfully");
      setEditMember(null);
      resetForm();
    },
    onError: () => toast.error("Failed to update team member"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team member deleted successfully");
      setDeleteMember(null);
    },
    onError: () => toast.error("Failed to delete team member"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/team?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleAdd = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    createMutation.mutate({ name: formName, email: formEmail, role: formRole, password: formPassword });
  };

  const handleEdit = () => {
    if (!editMember || !formName.trim() || !formEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    updateMutation.mutate({
      id: editMember.id,
      name: formName,
      email: formEmail,
      role: formRole,
      ...(formPassword ? { password: formPassword } : {}),
    });
  };

  const openEdit = (member: TeamMember) => {
    setFormName(member.name);
    setFormEmail(member.email);
    setFormRole(member.role);
    setFormPassword("");
    setEditMember(member);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to your CRM.</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Invite a new member to join your CRM team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input id="add-name" placeholder="Full name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input id="add-email" type="email" placeholder="email@company.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">Role</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Password</Label>
                  <Input id="add-password" type="password" placeholder="Create a password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No team members yet. Add your first member above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[member.role]}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={member.active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: member.id, active: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(member)}
                            className="h-8 px-2"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteMember(member)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) { setEditMember(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update member information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input id="edit-password" type="password" placeholder="Leave blank to keep current" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditMember(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMember} onOpenChange={(open) => { if (!open) setDeleteMember(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMember && deleteMutation.mutate(deleteMember.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Thematic Areas Tab
// ──────────────────────────────────────────────

function ThematicAreasTab() {
  const queryClient = useQueryClient();
  const [items, setItems] = React.useState<ThematicArea[]>([]);
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState("#6366f1");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editColor, setEditColor] = React.useState("");
  const [deleteItem, setDeleteItem] = React.useState<ThematicArea | null>(null);

  const { data, isLoading } = useQuery<ThematicArea[]>({
    queryKey: ["thematic-areas"],
    queryFn: async () => {
      const res = await fetch("/api/thematic-areas");
      if (!res.ok) throw new Error("Failed to fetch thematic areas");
      return res.json();
    },
  });

  React.useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; sortOrder: number }) => {
      const res = await fetch("/api/thematic-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create thematic area");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thematic-areas"] });
      toast.success("Thematic area created");
      setNewName("");
      setNewColor("#6366f1");
    },
    onError: () => toast.error("Failed to create thematic area"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string; sortOrder: number }) => {
      const res = await fetch("/api/thematic-areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update thematic area");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thematic-areas"] });
      toast.success("Thematic area updated");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update thematic area"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/thematic-areas?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thematic area");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thematic-areas"] });
      toast.success("Thematic area deleted");
      setDeleteItem(null);
    },
    onError: () => toast.error("Failed to delete thematic area"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch("/api/thematic-areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: items }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thematic-areas"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    reorderMutation.mutate(
      newItems.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    );
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate({
      name: newName.trim(),
      color: newColor,
      sortOrder: items.length,
    });
  };

  const startEdit = (item: ThematicArea) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditColor(item.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const saveEdit = (item: ThematicArea) => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({
      id: item.id,
      name: editName.trim(),
      color: editColor,
      sortOrder: item.sortOrder,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thematic Areas</CardTitle>
          <CardDescription>
            Define thematic areas for your projects. Drag to reorder priority.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="size-9 cursor-pointer rounded border p-0.5"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="New thematic area"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
            </div>
            <Button onClick={handleAdd} disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add
            </Button>
          </div>

          <Separator />

          {/* List */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No thematic areas defined yet.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      color={item.color}
                      name={item.name}
                      isEditing={editingId === item.id}
                      editName={editName}
                      editColor={editColor}
                      onEditNameChange={setEditName}
                      onEditColorChange={setEditColor}
                      onEdit={() => startEdit(item)}
                      onSave={() => saveEdit(item)}
                      onCancel={cancelEdit}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thematic Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteItem?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Services Tab
// ──────────────────────────────────────────────

function ServicesTab() {
  const queryClient = useQueryClient();
  const [items, setItems] = React.useState<Service[]>([]);
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState("#10b981");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editColor, setEditColor] = React.useState("");
  const [deleteItem, setDeleteItem] = React.useState<Service | null>(null);

  const { data, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  React.useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; sortOrder: number }) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service created");
      setNewName("");
      setNewColor("#10b981");
    },
    onError: () => toast.error("Failed to create service"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string; sortOrder: number }) => {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service updated");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update service"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
      setDeleteItem(null);
    },
    onError: () => toast.error("Failed to delete service"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: items }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    reorderMutation.mutate(
      newItems.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    );
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate({
      name: newName.trim(),
      color: newColor,
      sortOrder: items.length,
    });
  };

  const startEdit = (item: Service) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditColor(item.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const saveEdit = (item: Service) => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({
      id: item.id,
      name: editName.trim(),
      color: editColor,
      sortOrder: item.sortOrder,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            Define services offered by your organization. Drag to reorder priority.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="size-9 cursor-pointer rounded border p-0.5"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="New service"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
            </div>
            <Button onClick={handleAdd} disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add
            </Button>
          </div>

          <Separator />

          {/* List */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Briefcase className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No services defined yet.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      color={item.color}
                      name={item.name}
                      isEditing={editingId === item.id}
                      editName={editName}
                      editColor={editColor}
                      onEditNameChange={setEditName}
                      onEditColorChange={setEditColor}
                      onEdit={() => startEdit(item)}
                      onSave={() => saveEdit(item)}
                      onCancel={cancelEdit}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteItem?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Business Targets Tab
// ──────────────────────────────────────────────

function BusinessTargetsTab() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = React.useState("2025");
  const [annualTarget, setAnnualTarget] = React.useState<number>(0);
  const [monthlyOverrides, setMonthlyOverrides] = React.useState<number[]>(
    Array(12).fill(0)
  );
  const [serviceTargets, setServiceTargets] = React.useState<ServiceTarget[]>([]);
  const [showMonthlyOverrides, setShowMonthlyOverrides] = React.useState(false);
  const [expandedServiceId, setExpandedServiceId] = React.useState<string | null>(null);

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: targetData, isLoading } = useQuery<YearTarget>({
    queryKey: ["targets", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/targets?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to fetch targets");
      return res.json();
    },
    enabled: !!selectedYear,
  });

  React.useEffect(() => {
    if (targetData) {
      setAnnualTarget(targetData.annualTarget || 0);
      const overrides = Array(12).fill(0);
      if (targetData.monthlyOverrides && targetData.monthlyOverrides.length > 0) {
        targetData.monthlyOverrides.forEach((mo: MonthlyOverride) => {
          overrides[mo.month - 1] = mo.amount;
        });
      } else if (targetData.annualTarget) {
        const monthlyDefault = Math.round(targetData.annualTarget / 12);
        for (let i = 0; i < 12; i++) overrides[i] = monthlyDefault;
      }
      setMonthlyOverrides(overrides);
      setShowMonthlyOverrides(
        targetData.monthlyOverrides && targetData.monthlyOverrides.length > 0
      );

      if (targetData.serviceTargets && targetData.serviceTargets.length > 0) {
        setServiceTargets(targetData.serviceTargets);
      } else {
        setServiceTargets([]);
      }
    } else {
      setAnnualTarget(0);
      setMonthlyOverrides(Array(12).fill(0));
      setServiceTargets([]);
      setShowMonthlyOverrides(false);
    }
  }, [targetData]);

  const recalculateMonthlyDefaults = (annual: number) => {
    const monthlyDefault = Math.round(annual / 12);
    setMonthlyOverrides(Array(12).fill(monthlyDefault));
  };

  const handleAnnualTargetChange = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, "")) || 0;
    setAnnualTarget(num);
    if (!showMonthlyOverrides) {
      recalculateMonthlyDefaults(num);
    }
  };

  const handleMonthlyOverrideChange = (index: number, val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, "")) || 0;
    const newOverrides = [...monthlyOverrides];
    newOverrides[index] = num;
    setMonthlyOverrides(newOverrides);
  };

  const handleAddServiceTarget = () => {
    if (!services || services.length === 0) {
      toast.error("No services available. Add services first.");
      return;
    }
    const existingIds = serviceTargets.map((st) => st.serviceId);
    const available = services.find((s) => !existingIds.includes(s.id));
    if (!available) {
      toast.error("All services already have targets");
      return;
    }
    const newTarget: ServiceTarget = {
      serviceId: available.id,
      serviceName: available.name,
      annualTarget: 0,
      showMonthly: false,
      monthlyOverrides: Array(12)
        .fill(0)
        .map((_, i) => ({ month: i + 1, amount: 0 })),
    };
    setServiceTargets([...serviceTargets, newTarget]);
    setExpandedServiceId(available.id);
  };

  const handleServiceAnnualTargetChange = (serviceId: string, val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, "")) || 0;
    setServiceTargets(
      serviceTargets.map((st) => {
        if (st.serviceId !== serviceId) return st;
        const monthlyDefault = Math.round(num / 12);
        return {
          ...st,
          annualTarget: num,
          monthlyOverrides: st.showMonthly
            ? st.monthlyOverrides
            : st.monthlyOverrides.map((mo) => ({ ...mo, amount: monthlyDefault })),
        };
      })
    );
  };

  const handleServiceMonthlyOverride = (
    serviceId: string,
    monthIndex: number,
    val: string
  ) => {
    const num = parseInt(val.replace(/[^0-9]/g, "")) || 0;
    setServiceTargets(
      serviceTargets.map((st) => {
        if (st.serviceId !== serviceId) return st;
        return {
          ...st,
          monthlyOverrides: st.monthlyOverrides.map((mo, i) =>
            i === monthIndex ? { ...mo, amount: num } : mo
          ),
        };
      })
    );
  };

  const handleToggleServiceMonthly = (serviceId: string) => {
    setServiceTargets(
      serviceTargets.map((st) => {
        if (st.serviceId !== serviceId) return st;
        const newShow = !st.showMonthly;
        if (newShow) {
          const monthlyDefault = Math.round(st.annualTarget / 12);
          return {
            ...st,
            showMonthly: true,
            monthlyOverrides: st.monthlyOverrides.map((mo) => ({
              ...mo,
              amount: monthlyDefault,
            })),
          };
        }
        return { ...st, showMonthly: false };
      })
    );
  };

  const handleRemoveServiceTarget = (serviceId: string) => {
    setServiceTargets(serviceTargets.filter((st) => st.serviceId !== serviceId));
    if (expandedServiceId === serviceId) setExpandedServiceId(null);
  };

  const totalMonthly = monthlyOverrides.reduce((sum, v) => sum + v, 0);
  const achievementPct = annualTarget > 0 ? Math.min(Math.round((totalMonthly / annualTarget) * 100), 100) : 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targets = [
        {
          year: parseInt(selectedYear),
          annualTarget,
          monthlyOverrides: monthlyOverrides
            .map((amount, i) => ({ month: i + 1, amount }))
            .filter((mo) => mo.amount > 0),
          serviceTargets: serviceTargets.map((st) => ({
            serviceId: st.serviceId,
            annualTarget: st.annualTarget,
            monthlyOverrides: st.showMonthly
              ? st.monthlyOverrides.filter((mo) => mo.amount > 0)
              : [],
          })),
        },
      ];
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      });
      if (!res.ok) throw new Error("Failed to save targets");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets", selectedYear] });
      toast.success("Business targets saved successfully");
    },
    onError: () => toast.error("Failed to save business targets"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Business Targets</CardTitle>
          <CardDescription>
            Set annual and monthly revenue targets for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Annual Target (PKR)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 12000000"
                value={annualTarget || ""}
                onChange={(e) => handleAnnualTargetChange(e.target.value)}
              />
              {annualTarget > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatPKR(annualTarget)} per year &middot; {formatPKR(Math.round(annualTarget / 12))} per month (default)
                </p>
              )}
            </div>
          </div>

          {/* Monthly Overrides */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={showMonthlyOverrides}
                onCheckedChange={(checked) => {
                  setShowMonthlyOverrides(checked);
                  if (checked) {
                    recalculateMonthlyDefaults(annualTarget);
                  }
                }}
              />
              <Label>Customize Monthly Targets</Label>
            </div>

            {showMonthlyOverrides && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {MONTHS.map((month, i) => (
                  <div key={month} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{month}</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={monthlyOverrides[i] || ""}
                      onChange={(e) => handleMonthlyOverrideChange(i, e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service-Specific Targets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Service-Specific Targets</CardTitle>
            <CardDescription>
              Set individual targets for each service line.
            </CardDescription>
          </div>
          <Button onClick={handleAddServiceTarget} variant="outline" className="gap-2">
            <Plus className="size-4" />
            Add Service Target
          </Button>
        </CardHeader>
        <CardContent>
          {serviceTargets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Target className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No service-specific targets. Click &quot;Add Service Target&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceTargets.map((st) => (
                <Card key={st.serviceId} className="border shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          setExpandedServiceId(
                            expandedServiceId === st.serviceId ? null : st.serviceId
                          )
                        }
                      >
                        {expandedServiceId === st.serviceId ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className="font-medium">{st.serviceName}</p>
                        {st.annualTarget > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Annual: {formatPKR(st.annualTarget)}
                          </p>
                        )}
                      </div>
                      <div className="w-48">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Annual target"
                          value={st.annualTarget || ""}
                          onChange={(e) =>
                            handleServiceAnnualTargetChange(st.serviceId, e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Monthly</Label>
                        <Switch
                          checked={st.showMonthly}
                          onCheckedChange={() => handleToggleServiceMonthly(st.serviceId)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveServiceTarget(st.serviceId)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {expandedServiceId === st.serviceId && st.showMonthly && (
                      <div className="ml-11 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {MONTHS.map((month, i) => (
                          <div key={month} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{month}</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={st.monthlyOverrides[i]?.amount || ""}
                              onChange={(e) =>
                                handleServiceMonthlyOverride(st.serviceId, i, e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Progress Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Target Progress Preview</CardTitle>
          <CardDescription>
            Overview of your {selectedYear} targets vs. planned amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Annual Target</span>
              <span className="font-medium">{formatPKR(annualTarget)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Monthly Planned</span>
              <span>{formatPKR(totalMonthly)}</span>
            </div>
            <Progress value={achievementPct} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">
              {achievementPct}% of annual target allocated monthly
            </p>
          </div>

          {serviceTargets.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Service Breakdown</p>
                {serviceTargets.map((st) => {
                  const servicePct =
                    annualTarget > 0
                      ? Math.round((st.annualTarget / annualTarget) * 100)
                      : 0;
                  return (
                    <div key={st.serviceId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{st.serviceName}</span>
                        <span className="text-muted-foreground">
                          {formatPKR(st.annualTarget)} ({servicePct}%)
                        </span>
                      </div>
                      <Progress value={servicePct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2 min-w-[140px]"
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Targets
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Settings Component
// ──────────────────────────────────────────────

export function CRMSettings() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your CRM configuration, team, and business parameters.
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="branding" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Company Branding</span>
            <span className="sm:hidden">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm">
            <Users className="size-4" />
            <span className="hidden sm:inline">Team Management</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger value="thematic" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="size-4" />
            <span className="hidden sm:inline">Thematic Areas</span>
            <span className="sm:hidden">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm">
            <Briefcase className="size-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="targets" className="gap-1.5 text-xs sm:text-sm">
            <Target className="size-4" />
            <span className="hidden sm:inline">Business Targets</span>
            <span className="sm:hidden">Targets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <CompanyBrandingTab />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementTab />
        </TabsContent>

        <TabsContent value="thematic">
          <ThematicAreasTab />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>

        <TabsContent value="targets">
          <BusinessTargetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CRMSettings;
