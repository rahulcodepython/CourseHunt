"use client";

import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@package/components/page-header";
import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";
import { Textarea } from "@package/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { cn } from "@package/lib/utils";

const serviceNames = ["Web", "Tutor", "API Backend", "Payment", "Database"];

const scheduledMaintenance = [
    { date: "2026-08-02 02:00 - 03:00", services: "Web, API Backend, Database", status: "upcoming" as const },
    { date: "2026-07-20 01:00 - 01:30", services: "Payment", status: "completed" as const },
];

function ScheduleDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [start, setStart] = React.useState("");
    const [end, setEnd] = React.useState("");
    const [message, setMessage] = React.useState("");

    const toggleService = (name: string) => {
        setSelected((prev) =>
            prev.includes(name)
                ? prev.filter((s) => s !== name)
                : [...prev, name],
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Maintenance window scheduled");
        onOpenChange(false);
        setSelected([]);
        setStart("");
        setEnd("");
        setMessage("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule Maintenance</DialogTitle>
                    <DialogDescription>
                        Schedule a maintenance window for specific services
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Services</Label>
                        <div className="space-y-1.5">
                            {serviceNames.map((name) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span className="text-sm">{name}</span>
                                    <Switch
                                        checked={selected.includes(name)}
                                        onCheckedChange={() => toggleService(name)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="start">Start</Label>
                            <Input
                                id="start"
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="end">End</Label>
                            <Input
                                id="end"
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="msg">Message</Label>
                        <Textarea
                            id="msg"
                            placeholder="Message shown to users during maintenance"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Schedule</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function MaintenancePage() {
    const [active, setActive] = React.useState(false);
    const [services, setServices] = React.useState<Record<string, boolean>>(
        Object.fromEntries(serviceNames.map((name) => [name, true])),
    );
    const [scheduleOpen, setScheduleOpen] = React.useState(false);

    const handleToggle = () => {
        if (!active) {
            const confirmed = window.confirm(
                "Are you sure you want to enable maintenance mode? Users will not be able to access the platform.",
            );
            if (!confirmed) return;
        }
        setActive((prev) => {
            const next = !prev;
            toast[next ? "info" : "success"](
                next
                    ? "Maintenance mode enabled"
                    : "All services operational",
            );
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Maintenance"
                subtitle="Control maintenance mode and schedule downtime"
            />

            <Card
                className={cn(
                    active
                        ? "border-destructive"
                        : "border-green-500",
                )}
            >
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <span
                        className={cn(
                            "size-3 shrink-0 rounded-full",
                            active ? "bg-red-500" : "bg-green-500",
                        )}
                    />
                    <div className="flex-1">
                        <p className="text-sm font-semibold">
                            {active
                                ? "Maintenance Mode Active"
                                : "All Services Operational"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {active
                                ? "The platform is currently in maintenance mode. Users cannot make purchases or create content."
                                : "The platform is running normally. No ongoing maintenance."}
                        </p>
                    </div>
                    <Button
                        variant={active ? "default" : "destructive"}
                        onClick={handleToggle}
                    >
                        {active ? "Disable Maintenance" : "Enable Maintenance"}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Service Toggles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {serviceNames.map((name) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-between py-2.5"
                                >
                                    <span className="text-sm font-medium">{name}</span>
                                    <Switch
                                        checked={services[name]}
                                        onCheckedChange={(checked) =>
                                            setServices((prev) => ({ ...prev, [name]: checked }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Schedule Maintenance</CardTitle>
                        <Button size="sm" onClick={() => setScheduleOpen(true)}>
                            Schedule
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduledMaintenance.map((item) => (
                                    <TableRow key={item.date}>
                                        <TableCell className="text-sm">{item.date}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{item.services}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.status === "upcoming" ? "secondary" : "outline"}
                                                className={item.status === "upcoming" ? "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400" : ""}
                                            >
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {scheduledMaintenance.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No scheduled maintenance
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="IconInfoCircle" className="size-3.5" />
                Service toggles and schedule are demo data with no live integration.
            </p>

            <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
        </div>
    );
}
