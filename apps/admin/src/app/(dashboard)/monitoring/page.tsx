"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Progress } from "@package/ui/progress";

const services = [
    { name: "API (Go Backend)", status: "up", uptime: "99.9%", responseTime: "45ms" },
    { name: "Web Application", status: "up", uptime: "99.8%", responseTime: "120ms" },
    { name: "Tutor Application", status: "up", uptime: "99.7%", responseTime: "115ms" },
    { name: "Database (PostgreSQL)", status: "up", uptime: "99.95%", responseTime: "5ms" },
    { name: "Image CDN", status: "up", uptime: "99.99%", responseTime: "30ms" },
    { name: "Payment Gateway", status: "up", uptime: "99.9%", responseTime: "200ms" },
];

export default function MonitoringPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Monitoring</h1>
                <p className="text-muted-foreground text-sm">System resources, service health, and performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">42%</div>
                        <Progress value={42} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">68%</div>
                        <Progress value={68} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">55%</div>
                        <Progress value={55} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Health</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {services.map((s) => (
                            <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 rounded-full ${s.status === "up" ? "bg-green-500" : "bg-red-500"}`} />
                                    <div>
                                        <p className="font-medium text-sm">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">Uptime: {s.uptime}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Response: {s.responseTime}</span>
                                    <Badge variant={s.status === "up" ? "secondary" : "destructive"} className={s.status === "up" ? "bg-green-100 text-green-800" : ""}>
                                        {s.status === "up" ? "Operational" : "Down"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
