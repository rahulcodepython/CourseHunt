"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { getColumns, type MaintenanceRecord } from "./columns";

const availableServices = [
  { id: "srv_web", name: "Web Application" },
  { id: "srv_tutor", name: "Tutor Portal" },
  { id: "srv_api", name: "API Backend" },
  { id: "srv_payment", name: "Payment Processing" },
  { id: "srv_db", name: "Database Cluster" },
];

const initialRecords: MaintenanceRecord[] = [
  {
    id: "mnt_1",
    dateTime: "2026-08-15 02:00 - 04:00",
    services: ["Web Application", "API Backend", "Database Cluster"],
    message: "Scheduled database indexing and system upgrade",
    duration: "2 hours",
    status: "upcoming",
  },
  {
    id: "mnt_2",
    dateTime: "2026-08-12 09:00 - Ongoing",
    services: ["Payment Processing"],
    message: "Emergency payment gateway hotfix",
    duration: "1 hour 30m",
    status: "ongoing",
  },
  {
    id: "mnt_3",
    dateTime: "2026-07-20 01:00 - 01:30",
    services: ["Tutor Portal"],
    message: "Routine security patches applied",
    duration: "30 mins",
    status: "completed",
  },
];

const maintenanceSchema = z.object({
  serviceIds: z.array(z.string()).min(1, "Please select at least one service"),
  message: z.string().optional(),
  isScheduleEnabled: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

function MaintenanceModal({
  open,
  onOpenChange,
  onAddMaintenance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMaintenance: (record: MaintenanceRecord) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      serviceIds: availableServices.map((s) => s.id),
      message: "",
      isScheduleEnabled: false,
      startDate: "",
      endDate: "",
    },
  });

  const selectedServiceIds = watch("serviceIds") || [];
  const isScheduleEnabled = watch("isScheduleEnabled");
  const startDate = watch("startDate") || "";
  const endDate = watch("endDate") || "";

  const isAllSelected = selectedServiceIds.length === availableServices.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setValue("serviceIds", []);
    } else {
      setValue("serviceIds", availableServices.map((s) => s.id));
    }
  };

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setValue("serviceIds", selectedServiceIds.filter((s) => s !== id));
    } else {
      setValue("serviceIds", [...selectedServiceIds, id]);
    }
  };

  const onSubmit = (data: MaintenanceFormData) => {
    if (data.isScheduleEnabled && (!data.startDate || !data.endDate)) {
      toast.error("Please select both start and end date/time for scheduled maintenance");
      return;
    }

    const selectedServiceNames = availableServices
      .filter((s) => data.serviceIds.includes(s.id))
      .map((s) => s.name);

    const formattedDates = data.isScheduleEnabled
      ? `${data.startDate?.replace("T", " ")} to ${data.endDate?.replace("T", " ")}`
      : `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)} - Immediate`;

    const newRecord: MaintenanceRecord = {
      id: `mnt_${Date.now()}`,
      dateTime: formattedDates,
      services: selectedServiceNames,
      message: data.message?.trim() || "System maintenance window",
      duration: data.isScheduleEnabled ? "Scheduled" : "Immediate",
      status: data.isScheduleEnabled ? "upcoming" : "ongoing",
    };

    onAddMaintenance(newRecord);
    toast.success(
      data.isScheduleEnabled
        ? "Maintenance window scheduled"
        : "Maintenance mode enabled for selected services",
    );

    reset();
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Put Maintenance"
      description="Select target services and configure downtime window or schedule."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Select Services</Label>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Service Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableServices.map((service) => {
                  const checked = selectedServiceIds.includes(service.id);
                  return (
                    <TableRow
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="size-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {errors.serviceIds && (
            <p className="text-xs text-red-400">{errors.serviceIds.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mnt-msg">Maintenance Message</Label>
          <Textarea
            id="mnt-msg"
            placeholder="Notice shown to platform users during downtime..."
            {...register("message")}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
          <div>
            <p className="text-sm font-medium">Enable Schedule</p>
            <p className="text-xs text-muted-foreground">
              Toggle ON to set a future start and end downtime window.
            </p>
          </div>
          <Controller
            control={control}
            name="isScheduleEnabled"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {isScheduleEnabled && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 bg-muted/10">
            <div className="space-y-1.5">
              <Label>Start Date & Time</Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select start date & time"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date & Time</Label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select end date & time"
                  />
                )}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isScheduleEnabled ? "Schedule Downtime" : "Enable Maintenance"}
          </Button>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function MaintenancePage() {
  const [records, setRecords] = React.useState<MaintenanceRecord[]>(initialRecords);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleAddMaintenance = (newRecord: MaintenanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleCancelMaintenance = (record: MaintenanceRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: "cancelled" } : r)),
    );
    toast.success(`Upcoming maintenance for ${record.services.join(", ")} cancelled`);
  };

  const handleResumeServices = (record: MaintenanceRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: "completed" } : r)),
    );
    toast.success(`Maintenance ended. Services resumed for ${record.services.join(", ")}`);
  };

  const ongoingCount = records.filter((r) => r.status === "ongoing").length;
  const columns = getColumns(handleCancelMaintenance, handleResumeServices);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        subtitle="Manage live platform downtime windows and scheduled maintenance"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Icon name="server" className="size-4" />
            Put Maintenance
          </Button>
        }
      />

      {ongoingCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-3">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-destructive" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Maintenance Mode Active ({ongoingCount} active session)
              </p>
              <p className="text-xs opacity-90">
                Target services are restricted. Click &quot;Resume Services&quot; in the table below to restore full operational state.
              </p>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={records}
        searchPlaceholder="Search maintenance records..."
        emptyIcon="clock"
        emptyText="No maintenance records found"
      />

      <MaintenanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddMaintenance={handleAddMaintenance}
      />
    </div>
  );
}
