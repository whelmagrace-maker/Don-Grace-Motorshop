import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ClientFormSheet from "@/components/clients/ClientFormSheet";
import ConfirmSheet from "@/components/ui/ConfirmSheet";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, Phone, Bike, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { getInitials, formatPeso } from "@/utils/format";
import { toast } from "sonner";
import { Toaster } from "sonner";

export default function Clients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list() });

  const filtered = useMemo(() => {
    return clients
      .filter(c => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.motor_model?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [clients, search]);

  const handleSave = async (data, existing) => {
    if (existing) {
      await base44.entities.Client.update(existing.id, data);
      toast.success("Client updated!");
    } else {
      await base44.entities.Client.create(data);
      toast.success("Client added!");
    }
    qc.invalidateQueries({ queryKey: ["clients"] });
    setSheetOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async () => {
    await base44.entities.Client.delete(deleteTarget.id);
    qc.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Client deleted");
    setDeleteTarget(null);
  };

  // Detail View
  if (detailClient) {
    const clientJobs = jobs.filter(j => j.client_id === detailClient.id || j.client_name === detailClient.full_name).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const totalSpent = clientJobs.filter(j => j.status === "Done").reduce((s, j) => s + (j.grand_total || 0), 0);

    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <Toaster />
        <button onClick={() => setDetailClient(null)} className="flex items-center gap-2 text-primary font-medium mb-5 -ml-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Clients
        </button>

        <div className="bg-white rounded-xl border border-border p-5 mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {getInitials(detailClient.full_name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{detailClient.full_name}</h2>
              {detailClient.contact_number && <p className="text-sm text-muted-foreground">{detailClient.contact_number}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {detailClient.motor_model && <div><p className="text-xs text-muted-foreground">Motor</p><p className="font-medium">{detailClient.motor_model}</p></div>}
            {detailClient.plate_number && <div><p className="text-xs text-muted-foreground">Plate</p><p className="font-medium">{detailClient.plate_number}</p></div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{clientJobs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Jobs</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatPeso(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-3">Job History</h3>
        {clientJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No jobs found for this client.</p>
        ) : (
          <div className="space-y-3">
            {clientJobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{job.job_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(job.job_date || job.created_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span className="text-base font-bold text-primary">{formatPeso(job.grand_total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <Toaster />
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <p className="text-sm text-muted-foreground">{clients.length} clients</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or motor..." className="pl-10 h-12" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-base font-medium text-muted-foreground">No clients yet.</p>
          <p className="text-sm text-muted-foreground">Tap + to add one.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filtered.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
              onClick={() => setDetailClient(client)}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {getInitials(client.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">{client.full_name}</p>
                {client.contact_number && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{client.contact_number}</p>}
                {client.motor_model && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Bike className="w-3 h-3" />{client.motor_model}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <button onClick={e => { e.stopPropagation(); setEditingClient(client); setSheetOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(client); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { setEditingClient(null); setSheetOpen(true); }}
        className="fixed bottom-20 right-5 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus className="w-7 h-7" />
      </button>

      <ClientFormSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditingClient(null); }}
        editingClient={editingClient}
        onSave={handleSave}
      />

      <ConfirmSheet
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Client?"
        description={`This will permanently delete ${deleteTarget?.full_name}. Their job records will remain.`}
        onConfirm={handleDelete}
        confirmLabel="Delete Client"
      />
    </div>
  );
}
