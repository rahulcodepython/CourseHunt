import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, ROUTES } from "@/lib/constants/const";

export const metadata: Metadata = {
  title: `Data Security | ${LEGAL.BRAND}`,
  description: `The technical and organisational measures ${LEGAL.BRAND} uses to protect your data.`,
};

const sections: LegalSection[] = [
  {
    id: "encryption",
    title: "Encryption",
    content: (
      <ul>
        <li>
          Every connection to the website, the API and file storage uses HTTPS (TLS). Plain HTTP is
          not served.
        </li>
        <li>Connections between our servers and the database are encrypted with TLS.</li>
        <li>Data is stored with our hosting providers&apos; encryption at rest.</li>
      </ul>
    ),
  },
  {
    id: "authentication",
    title: "Sign-in and accounts",
    content: (
      <ul>
        <li>
          Students sign in with Google or a one-time code sent to their email, so there is no
          password to steal.
        </li>
        <li>
          Staff passwords are stored only as salted one-way hashes (scrypt), never in readable form.
        </li>
        <li>Two-factor authentication is available for accounts.</li>
        <li>
          Sign-in attempts and code checks are rate-limited to block password guessing and code
          brute-forcing.
        </li>
        <li>
          Each request to our API carries a short-lived signed token. The API verifies its signature
          with our published public keys before doing anything.
        </li>
      </ul>
    ),
  },
  {
    id: "access-control",
    title: "Access control",
    content: (
      <ul>
        <li>
          Every API request is checked against the account&apos;s role and permissions, read fresh
          from the database each time. Revoking a permission or banning an account takes effect
          immediately.
        </li>
        <li>
          Tutors can only manage their own courses. Lessons, quizzes and resources are listed only
          to students enrolled in the course.
        </li>
        <li>
          Administrative access is limited to staff who need it, and every change they make is
          written to an audit log.
        </li>
      </ul>
    ),
  },
  {
    id: "course-content",
    title: "Course videos and files",
    content: (
      <ul>
        <li>
          Uploaded files, including lesson videos and resources, are stored with our storage
          provider and delivered over HTTPS.
        </li>
        <li>
          Every file gets a long random name, so its address cannot be guessed. Anyone who is given
          a file&apos;s direct link can open it, so do not share those links.
        </li>
        <li>
          Files are uploaded straight to storage through single-use signed upload links, and only
          approved file types are accepted.
        </li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    content: (
      <ul>
        <li>
          Payments are handled by Razorpay, a PCI-DSS compliant payment gateway. Card, UPI and bank
          details never reach our servers.
        </li>
        <li>
          Payment confirmations from Razorpay are accepted only when their cryptographic signature
          is valid, so a forged confirmation cannot unlock a course.
        </li>
      </ul>
    ),
  },
  {
    id: "application-security",
    title: "Application security",
    content: (
      <ul>
        <li>Text that users write is sanitised before it is stored or displayed.</li>
        <li>Database queries are parameterised to prevent injection.</li>
        <li>
          The API sends security headers and only accepts browser requests from our own website.
        </li>
        <li>Requests are rate-limited per client to absorb abuse and automated attacks.</li>
      </ul>
    ),
  },
  {
    id: "monitoring",
    title: "Monitoring and backups",
    content: (
      <ul>
        <li>
          Sign-ins, unauthorised access attempts and rate-limit hits are recorded as security events
          and reviewed by administrators.
        </li>
        <li>The database is backed up daily by our hosting provider.</li>
        <li>
          Secrets and keys are kept in our hosting providers&apos; encrypted settings, not in code.
        </li>
      </ul>
    ),
  },
  {
    id: "incidents",
    title: "If something goes wrong",
    content: (
      <p>
        If a security incident affects your personal data, we will contain it, investigate it, and
        notify you and the Data Protection Board of India as the law requires, explaining what
        happened and what we are doing about it.
      </p>
    ),
  },
  {
    id: "your-part",
    title: "What you can do",
    content: (
      <ul>
        <li>Turn on two-factor authentication.</li>
        <li>
          Keep your Google account and email account secure; they are the keys to your {LEGAL.BRAND}{" "}
          account.
        </li>
        <li>Sign out on shared devices.</li>
        <li>
          {LEGAL.BRAND} staff will never ask for your sign-in codes or passwords. Do not share them
          with anyone.
        </li>
      </ul>
    ),
  },
  {
    id: "reporting",
    title: "Reporting a vulnerability",
    content: (
      <p>
        If you find a security issue, email{" "}
        <a href={`mailto:${LEGAL.SECURITY_EMAIL}`}>{LEGAL.SECURITY_EMAIL}</a> with steps to
        reproduce it. Please give us reasonable time to fix it before disclosing it, and do not
        access other users&apos; data or disrupt the service while testing. We will acknowledge your
        report and keep you updated.
      </p>
    ),
  },
];

export default function DataSecurityPage() {
  return (
    <LegalPage
      title="Data Security"
      summary={
        <p>
          How we protect your account, your course content and your payments. No system is perfectly
          secure, but these are the measures we take. For what data we collect and why, see our{" "}
          <Link href={ROUTES.PRIVACY_POLICY}>Privacy Policy</Link>.
        </p>
      }
      sections={sections}
    />
  );
}
