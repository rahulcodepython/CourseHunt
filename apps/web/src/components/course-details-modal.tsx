"use client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/icon";
import type { Course } from "@/schema/courses.types";
import { formatDate, formatINR } from "@/lib/format";
import { COURSE_STATUS } from "@/lib/const";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return "—";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function StatCard({
    icon,
    label,
    value,
    subtext,
}: {
    icon: IconName;
    label: string;
    value: React.ReactNode;
    subtext?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name={icon} className="size-3.5 shrink-0" />
                {label}
            </div>
            <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
    );
}

function DetailRow({
    icon,
    label,
    children,
}: {
    icon: IconName;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Icon name={icon} className="size-4 shrink-0" />
                {label}
            </span>
            <span className="min-w-0 truncate text-right text-sm font-medium">
                {children}
            </span>
        </div>
    );
}

function DetailSection({
    title,
    icon,
    children,
}: {
    title: string;
    icon: IconName;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Icon name={icon} className="size-4 text-muted-foreground" />
                {title}
            </h3>
            <div className="text-sm">{children}</div>
        </section>
    );
}

function BulletList({ items }: { items: string[] }) {
    if (!items || items.length === 0) {
        return <p className="text-muted-foreground">—</p>;
    }
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <Icon
                        name="check"
                        className="mt-0.5 size-3.5 shrink-0 text-green-500"
                    />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export function CourseDetailsModal({
    course,
    open,
    onOpenChange,
}: {
    course: Course | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!course) return null;

    const showActualPrice =
        typeof course.actual_price === "number" &&
        course.actual_price > course.final_price;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <div className="flex items-start gap-4 pr-8">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                        {course.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={course.image_url}
                                alt={course.title}
                                className="size-full object-cover"
                            />
                        ) : (
                            <Icon name="book" className="size-8 opacity-40" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg leading-snug font-semibold">
                                {course.title}
                            </h2>
                            <Badge
                                variant={
                                    course.status === COURSE_STATUS.PUBLISHED
                                        ? "default"
                                        : "secondary"
                                }
                                className="capitalize"
                            >
                                {course.status}
                            </Badge>
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {course.slug}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {course.total_lectures} lectures ·{" "}
                            {formatDuration(course.total_duration_seconds)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StatCard
                        icon="currency-rupee"
                        label="Price"
                        value={formatINR(course.final_price)}
                        subtext={
                            showActualPrice ? (
                                <span className="text-muted-foreground line-through">
                                    {formatINR(course.actual_price)}
                                </span>
                            ) : undefined
                        }
                    />
                    <StatCard
                        icon="users"
                        label="Students"
                        value={course.student_count.toLocaleString()}
                    />
                    <StatCard
                        icon="star"
                        label="Rating"
                        value={course.rating_avg ? course.rating_avg.toFixed(1) : "—"}
                        subtext={`${course.feedback_count} reviews`}
                    />
                    <StatCard
                        icon="book"
                        label="Lectures"
                        value={course.total_lectures}
                    />
                    <StatCard
                        icon="clock"
                        label="Duration"
                        value={formatDuration(course.total_duration_seconds)}
                    />
                    <StatCard
                        icon="ticket"
                        label="Coupons"
                        value={
                            <span
                                className={cn(
                                    course.coupon_allowed
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-muted-foreground",
                                )}
                            >
                                {course.coupon_allowed ? "Allowed" : "Not allowed"}
                            </span>
                        }
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <DetailSection title="Course info" icon="settings">
                            <div className="divide-y">
                                <DetailRow icon="globe" label="Language">
                                    {course.language}
                                </DetailRow>
                                <DetailRow icon="chart-line" label="Level">
                                    <span className="capitalize">{course.level}</span>
                                </DetailRow>
                                <DetailRow icon="ticket" label="Coupon allowed">
                                    {course.coupon_allowed ? "Yes" : "No"}
                                </DetailRow>
                                <DetailRow icon="history" label="Created">
                                    {formatDate(course.created_at)}
                                </DetailRow>
                                <DetailRow icon="history" label="Updated">
                                    {formatDate(course.updated_at)}
                                </DetailRow>
                            </div>
                        </DetailSection>

                        <DetailSection title="Tutor" icon="user">
                            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                                {course.tutor?.image ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={course.tutor.image}
                                        alt={course.tutor.name}
                                        className="size-10 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Icon
                                            name="user"
                                            className="size-5 text-muted-foreground"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {course.tutor?.name || "—"}
                                    </p>
                                    <p className="truncate font-mono text-xs text-muted-foreground">
                                        {course.tutor?.id ?? course.tutor_id}
                                    </p>
                                </div>
                            </div>
                        </DetailSection>
                    </div>

                    <div className="space-y-6">
                        <DetailSection title="Description" icon="file-text">
                            <div className="space-y-2">
                                <p className="text-muted-foreground">
                                    {course.short_description || "—"}
                                </p>
                                <p className="text-muted-foreground">
                                    {course.long_description || "—"}
                                </p>
                            </div>
                        </DetailSection>

                        <DetailSection title="Benefits" icon="check">
                            <BulletList items={course.benefits} />
                        </DetailSection>

                        <DetailSection title="Requirements" icon="ban">
                            <BulletList items={course.requirements} />
                        </DetailSection>

                        {course.preview_video_url && (
                            <DetailSection title="Preview video" icon="external-link">
                                <a
                                    href={course.preview_video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                >
                                    {course.preview_video_url}
                                    <Icon name="external-link" className="size-3.5" />
                                </a>
                            </DetailSection>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}