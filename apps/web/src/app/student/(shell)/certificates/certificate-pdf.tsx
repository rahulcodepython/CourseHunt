"use client";

import { useEffect, useState } from "react";
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { Certificate } from "@/schema/certificate.types";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { AUTH_CONFIG, CERTIFICATE_SIGNATURE_FILENAME } from "@/lib/const";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
  },
  border: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#16a34a",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    position: "relative",
  },
  qr: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 64,
    height: 64,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 4,
    color: "#16a34a",
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 12,
    color: "#525252",
    marginBottom: 32,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    paddingBottom: 8,
  },
  body: {
    fontSize: 12,
    color: "#404040",
    marginBottom: 8,
  },
  course: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 16,
  },
  remark: {
    fontSize: 11,
    color: "#525252",
    marginBottom: 32,
    maxWidth: 420,
  },
  tutor: {
    fontSize: 11,
    color: "#404040",
    marginBottom: 40,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: 8,
  },
  signatureBlock: {
    alignItems: "center",
  },
  signatureImage: {
    width: 120,
    height: 45,
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#a3a3a3",
    width: 140,
    marginTop: 4,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#737373",
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: "#737373",
  },
});

function CertificateDocument({
  studentName,
  certificate,
  qrDataUrl,
}: {
  studentName: string;
  certificate: Certificate;
  qrDataUrl: string;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {qrDataUrl ? <Image src={qrDataUrl} style={styles.qr} /> : null}
          <Text style={styles.brand}>COURSEHUNT</Text>
          <Text style={styles.heading}>Certificate of Completion</Text>
          <Text style={styles.subheading}>This certificate is proudly presented to</Text>
          <Text style={styles.name}>{studentName}</Text>
          <Text style={styles.body}>for successfully completing the course</Text>
          <Text style={styles.course}>{certificate.course.title}</Text>
          <Text style={styles.remark}>
            Awarded in recognition of the dedication, effort, and consistency shown throughout the course.
            We commend this achievement and wish continued success ahead.
          </Text>
          {certificate.tutor?.name ? (
            <Text style={styles.tutor}>Instructed by {certificate.tutor.name}</Text>
          ) : null}
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Image src={`/${CERTIFICATE_SIGNATURE_FILENAME}`} style={styles.signatureImage} />
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Authorized Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={{ fontSize: 11, marginBottom: 4 }}>{formatDate(certificate.issued_at)}</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Date Issued</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function CertificateDownloadButton({ studentName, certificate }: { studentName: string; certificate: Certificate }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? AUTH_CONFIG.DEFAULT_APP_URL;
    const verifyUrl = `${origin}/certificates/verify/${certificate.id}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 256 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [certificate.id]);

  return (
    <PDFDownloadLink
      document={<CertificateDocument studentName={studentName} certificate={certificate} qrDataUrl={qrDataUrl} />}
      fileName={`certificate-${certificate.course.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading || !qrDataUrl}>
          <Icon name="download" className="size-3.5" />
          {loading || !qrDataUrl ? "Preparing..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
