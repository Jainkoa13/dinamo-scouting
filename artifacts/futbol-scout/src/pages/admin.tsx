import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListPlayers, getListPlayersQueryKey } from "@workspace/api-client-react";
import { authApi, type ManagedUser } from "@/lib/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, KeyRound, UserX, UserCheck, Eye, EyeOff, ShieldCheck, Shield, Trash2, ArrowRightLeft } from "lucide-react";
import { useLocation } from "wouter";
import logoUrl from "@/assets/logo_dinamo.png";

export default function Admin() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  const [changingPasswordId, setChangingPasswordId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [transferPlayerId, setTransferPlayerId] = useState<string>("");
  const [transferTargetId, setTransferTargetId] = useState<string>("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: authApi.listUsers,
  });

  const createMutation = useMutation({
    mutationFn: () => authApi.createUser({ username: newUsername, password: newPassword, role: newRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setNewUsername(""); setNewPassword(""); setNewRole("user"); setShowCreatePwd(false);
      toast({ title: "Usuario creado correctamente" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => authApi.toggleUser(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => authApi.changeRole(id, role),
    onSuccess: (updated: ManagedUser) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: `Rol cambiado a ${updated.role === "admin" ? "Administrador" : "Usuario"}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => authApi.changePassword(id, password),
    onSuccess: () => {
      setChangingPasswordId(null); setNewPwd(""); setShowChangePwd(false);
      toast({ title: "Contraseña actualizada" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => authApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setConfirmDeleteId(null);
      toast({ title: "Usuario eliminado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const { data: allPlayers = [] } = useListPlayers();

  const transferMutation = useMutation({
    mutationFn: () => authApi.transferPlayer(Number(transferPlayerId), Number(transferTargetId)),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: getListPlayersQueryKey() });
      setTransferPlayerId(""); setTransferTargetId("");
      toast({ title: `${p.nombre} transferido correctamente` });
    },
    onError: (e: Error) => toast({ title: "Error al transferir", description: e.message, variant: "destructive" }),
  });

  function openChangePwd(id: number) {
    setChangingPasswordId(changingPasswordId === id ? null : id);
    setNewPwd("");
    setShowChangePwd(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Dinamo Ibaiondo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-sm">DINAMO IBAIONDO SCOUTING</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>Cerrar sesión</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Gestión de usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conectado como <strong>{user?.username}</strong>
          </p>
        </div>

        {/* Create user */}
        <section className="border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo usuario
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Usuario</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ej: mikel, ana.garcia…" />
            </div>
            <div className="space-y-1">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showCreatePwd ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCreatePwd(v => !v)}
                  tabIndex={-1}
                >
                  {showCreatePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!newUsername || !newPassword || createMutation.isPending}
          >
            Crear usuario
          </Button>
        </section>

        {/* User list */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Usuarios registrados</h2>
          {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {(users as ManagedUser[]).map((u) => (
            <div key={u.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{u.username}</span>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Admin" : "Usuario"}
                  </Badge>
                  <Badge variant={u.active ? "outline" : "destructive"}>
                    {u.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Cambiar contraseña */}
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => openChangePwd(u.id)}
                    title="Cambiar contraseña"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>

                  {u.username !== "admin" && (
                    <>
                      {/* Cambiar rol */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => roleMutation.mutate({ id: u.id, role: u.role === "admin" ? "user" : "admin" })}
                        title={u.role === "admin" ? "Quitar rol admin" : "Dar rol admin"}
                        disabled={roleMutation.isPending}
                      >
                        {u.role === "admin"
                          ? <ShieldCheck className="h-4 w-4 text-primary" />
                          : <Shield className="h-4 w-4 text-muted-foreground" />}
                      </Button>

                      {/* Activar / desactivar */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => toggleMutation.mutate({ id: u.id, active: !u.active })}
                        title={u.active ? "Desactivar" : "Activar"}
                        disabled={toggleMutation.isPending}
                      >
                        {u.active
                          ? <UserX className="h-4 w-4 text-destructive" />
                          : <UserCheck className="h-4 w-4 text-green-500" />}
                      </Button>

                      {/* Eliminar */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setConfirmDeleteId(u.id)}
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Confirmación de borrado */}
              {confirmDeleteId === u.id && (
                <div className="flex items-center gap-2 pt-1 text-sm">
                  <span className="text-destructive font-medium">¿Eliminar a <strong>{u.username}</strong>? Esta acción no se puede deshacer.</span>
                  <Button
                    size="sm" variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(u.id)}
                  >
                    Eliminar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                    Cancelar
                  </Button>
                </div>
              )}

              {/* Cambiar contraseña */}
              {changingPasswordId === u.id && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1 max-w-xs">
                    <Input
                      type={showChangePwd ? "text" : "password"}
                      placeholder="Nueva contraseña"
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowChangePwd(v => !v)}
                      tabIndex={-1}
                    >
                      {showChangePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    disabled={!newPwd || pwdMutation.isPending}
                    onClick={() => pwdMutation.mutate({ id: u.id, password: newPwd })}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setChangingPasswordId(null); setNewPwd(""); setShowChangePwd(false); }}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Transferir jugador */}
        <section className="border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Transferir jugador
          </h2>
          <p className="text-xs text-muted-foreground">
            Mueve un jugador a otro usuario. El equipo asignado se borrará porque pertenece al usuario original.
          </p>
          {allPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay jugadores en el sistema.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Jugador</Label>
                <select
                  value={transferPlayerId}
                  onChange={e => setTransferPlayerId(e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecciona jugador…</option>
                  {allPlayers.map(p => {
                    const owner = (users as ManagedUser[]).find(u => u.id === p.userId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nombre}{owner ? ` (${owner.username})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Destino</Label>
                <select
                  value={transferTargetId}
                  onChange={e => setTransferTargetId(e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecciona usuario…</option>
                  {(users as ManagedUser[]).map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <Button
            onClick={() => transferMutation.mutate()}
            disabled={!transferPlayerId || !transferTargetId || transferMutation.isPending}
            className="gap-1.5"
          >
            <ArrowRightLeft className="h-4 w-4" />
            {transferMutation.isPending ? "Transfiriendo…" : "Transferir"}
          </Button>
        </section>
      </main>
    </div>
  );
}
