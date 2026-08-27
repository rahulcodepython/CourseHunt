import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { formatDate } from "@/lib/format";
import { API_CONFIG, ROUTES } from "@/lib/const";
import { CertificateVerificationZod } from "@/schema/certificate.types";
import { ApiResponseZod } from "@/schema/common.types";

async function fetchVerification(id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? API_CONFIG.DEFAULT_URL;
    const res = await fetch(`${baseUrl}/api/v1/certificates/verify/${id}`, { cache: "no-store" });
    const json = await res.json();
    const parsed = ApiResponseZod(CertificateVerificationZod).safeParse(json);
    if (!parsed.success || !parsed.data.data) {
        return { valid: false } as const;
    }
    return parsed.data.data;
}

export default async function CertificateVerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const verification = await fetchVerification(id);

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
            <Card className="w-full max-w-lg">
                {verification.valid ? (
                    <>
                        <CardHeader className="flex flex-col items-center gap-2 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Icon name="shield-check" className="size-7" />
                            </div>
                            <h1 className="text-xl font-semibold">Certificate Verified</h1>
                            <p className="text-sm text-muted-foreground">
                                This is a legitimate certificate issued by CourseHunt.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                {verification.student?.image ? (
                                    <Image
                                        src={verification.student.image}
                                        alt={verification.student.name}
                                        width={40}
                                        height={40}
                                        className="size-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                        {verification.student?.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Awarded to</p>
                                    <p className="font-medium">{verification.student?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                {verification.course?.thumbnail ? (
                                    <Image
                                        src={verification.course.thumbnail}
                                        alt={verification.course.title}
                                        width={56}
                                        height={40}
                                        className="h-10 w-14 rounded object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
                                        <Icon name="book" className="size-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Course completed</p>
                                    <p className="font-medium">{verification.course?.title}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                {verification.tutor?.image ? (
                                    <Image
                                        src={verification.tutor.image}
                                        alt={verification.tutor.name}
                                        width={40}
                                        height={40}
                                        className="size-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                        {verification.tutor?.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Instructed by</p>
                                    <p className="font-medium">{verification.tutor?.name}</p>
                                </div>
                            </div>

                            {verification.issued_at ? (
                                <p className="text-center text-xs text-muted-foreground">
                                    Issued on {formatDate(verification.issued_at)}
                                </p>
                            ) : null}
                        </CardContent>
                    </>
                ) : (
                    <>
                        <CardHeader className="flex flex-col items-center gap-2 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Icon name="shield" className="size-7" />
                            </div>
                            <h1 className="text-xl font-semibold">Certificate Not Found</h1>
                            <p className="text-sm text-muted-foreground">
                                We couldn&apos;t verify a certificate with this ID. It may be invalid or no longer exists.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Link href={ROUTES.HOME} className="block text-center text-sm font-medium text-primary hover:underline">
                                Return to CourseHunt
                            </Link>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
