"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Separator } from "@package/ui/separator";
import { Switch } from "@package/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { Textarea } from "@package/ui/textarea";
import { useState } from "react";

const scheduledMaintenance = [
    { date: "2026-08-01 02:00 - 04:00", services: "API, Database", reason: "Database migration v2.1", status: "upcoming" },
    { date: "2026-07-25 03:00 - 05:00", services: "Web, Tutor", reason: "UI framework update", status: "completed" },
];

export default function MaintenancePage() {
    const [allServicesDown, setAllServicesDown] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Maintenance</h1>
                <p className="text-muted-foreground text-sm">Manage maintenance mode and scheduled downtime</p>
            </div>

            <Card className={allServicesDown ? "border-destructive" : "border-green-500"}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${allServicesDown ? "bg-red-500" : "bg-green-500"}`} />
                            <div>
                                <p className="font-medium">
                                    {allServicesDown ? "Maintenance Mode Active" : "All Services Operational"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {allServicesDown
                                        ? "All services are currently in maintenance mode. Users will see a maintenance page."
                                        : "All platform services are running normally."}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={allServicesDown ? "default" : "destructive"}
                            onClick={() => {
                                if (!allServicesDown && !confirm("Enable maintenance mode for ALL services? This will affect all users.")) return;
                                setAllServicesDown(!allServicesDown);
                            }}
                        >
                            <Icon name="IconTool" className="mr-1 h-4 w-4" />
                            {allServicesDown ? "Disable Maintenance" : "Enable Maintenance"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Service Toggles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Web Application", key: "web" },
                            { name: "Tutor Application", key: "tutor" },
                            { name: "API Backend", key: "api" },
                            { name: "Payment Processing", key: "payment" },
                            { name: "Database", key: "db" },
                        ].map((s) => (
                            <div key={s.key} className="flex items-center justify-between py-1">
                                <span className="text-sm font-medium">{s.name}</span>
                                <Switch />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Schedule Maintenance</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Schedule
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule Maintenance</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Services</Label>
                                        <div className="space-y-1">
                                            {["Web", "Tutor", "API", "Payments", "Database"].map((svc) => (
                                                <div key={svc} className="flex items-center gap-2">
                                                    <Switch /> <span className="text-sm">{svc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date/Time</Label>
                                            <Input type="datetime-local" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date/Time</Label>
                                            <Input type="datetime-local" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Message (shown to users)</Label>
                                        <Textarea placeholder="We'll be back shortly..." rows={3} />
                                    </div>
                                    <Button className="w-full">Schedule</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduledMaintenance.map((sm, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs">{sm.date}</TableCell>
                                        <TableCell className="text-sm">{sm.services}</TableCell>
                                        <TableCell>
                                            <Badge variant={sm.status === "upcoming" ? "secondary" : "outline"} className={sm.status === "upcoming" ? "bg-blue-100 text-blue-800" : ""}>
                                                {sm.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
