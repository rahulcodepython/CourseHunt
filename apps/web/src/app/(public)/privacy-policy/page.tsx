import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, ROUTES } from "@/lib/constants/const";

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL.BRAND}`,
  description: `How ${LEGAL.BRAND} collects, uses, shares and protects your personal data.`,
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <p>
        {LEGAL.BRAND} is an online learning platform where tutors publish courses and students enrol
        in them. This policy explains what personal data we process when you use the {LEGAL.BRAND}{" "}
        website and services, why we process it, and the choices you have. We act as the data
        fiduciary for the data described here, under the Digital Personal Data Protection Act, 2023
        and other applicable laws of {LEGAL.JURISDICTION}.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    title: "Data we collect",
    content: (
      <>
        <h3>Account information</h3>
        <ul>
          <li>
            <strong>Google sign-in:</strong> your name, email address and profile picture, as shared
            by Google. We never receive your Google password.
          </li>
          <li>
            <strong>Email sign-in:</strong> your email address and the one-time codes we send to it.
            Staff accounts that use a password have it stored only as a one-way hash.
          </li>
          <li>
            <strong>Profile:</strong> anything you add yourself, such as a profile photo, bio,
            headline or website.
          </li>
          <li>
            <strong>Security settings:</strong> whether two-factor authentication is enabled, and
            the data needed to verify it.
          </li>
        </ul>

        <h3>Learning activity</h3>
        <ul>
          <li>Courses you enrol in, wish-list and cart items.</li>
          <li>
            Lesson and chapter progress, including your video playback position and watch time, so
            you can resume where you left off.
          </li>
          <li>Quiz attempts and answers, assignment submissions, and certificates issued.</li>
          <li>Notes, discussion posts, feedback and ratings you write.</li>
        </ul>

        <h3>Payment information</h3>
        <p>
          Payments are processed by Razorpay. Card, UPI and bank details are entered on
          Razorpay&apos;s checkout and are <strong>never</strong> sent to or stored by us. We keep
          the order and payment identifiers, amount, taxes, coupon used, payment status and any
          refund status.
        </p>

        <h3>Content you upload</h3>
        <p>Profile photos, and for tutors, course images, videos and lesson resources.</p>

        <h3>Technical and security data</h3>
        <ul>
          <li>
            Your IP address and browser user-agent, recorded when you sign in and when a security
            event occurs (for example a blocked or rate-limited request).
          </li>
          <li>
            An audit log of actions that change data on the platform, recorded with the email of the
            account that performed them.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    title: "How we use your data",
    content: (
      <ul>
        <li>To create and secure your account and sign you in.</li>
        <li>To give you access to the courses you purchased and track your progress.</li>
        <li>To process payments, refunds and tax invoices.</li>
        <li>To issue certificates and let others verify them.</li>
        <li>
          To send service emails, such as sign-in codes and important account notices. We do not
          send marketing email without your consent.
        </li>
        <li>To detect, investigate and prevent fraud, abuse and security incidents.</li>
        <li>To comply with legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    content: (
      <>
        <p>We use only what is needed to run the service:</p>
        <ul>
          <li>
            <strong>Session cookies</strong> that keep you signed in. They are marked secure and
            cannot be read by other websites.
          </li>
          <li>
            <strong>Browser local storage</strong> for a copy of your session details and display
            preferences such as light or dark theme.
          </li>
        </ul>
        <p>
          We do not use advertising cookies or third-party analytics trackers. Signing out clears
          the session cookies and stored session details.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    content: (
      <>
        <p>We do not sell your personal data. We share it only as follows:</p>
        <ul>
          <li>
            <strong>Tutors</strong> can see the name and course progress of students enrolled in
            their courses, along with discussion posts, submissions and feedback in those courses.
          </li>
          <li>
            <strong>Anyone with a certificate link</strong> can verify that certificate, which shows
            the student&apos;s name and photo, the course, the tutor and the issue date.
          </li>
          <li>
            <strong>Service providers</strong> that process data on our behalf:
            <ul>
              <li>Google — sign-in</li>
              <li>Razorpay — payments and refunds</li>
              <li>Resend — transactional email</li>
              <li>Vercel — website hosting</li>
              <li>Voroa — application servers, database and cache (India)</li>
              <li>Cloudflare — file storage, delivery and DNS</li>
            </ul>
          </li>
          <li>
            <strong>Authorities</strong>, when required by law or to protect the rights and safety
            of our users and the platform.
          </li>
        </ul>
        <p>
          Some of these providers may process data outside {LEGAL.JURISDICTION}. We use providers
          that apply appropriate safeguards to the data they handle.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    content: (
      <ul>
        <li>Account and learning data: while your account is active.</li>
        <li>
          Payment and invoice records: for as long as tax and accounting laws require, even after
          the account is closed.
        </li>
        <li>Security and audit logs: for as long as needed to investigate and prevent abuse.</li>
        <li>Certificates: kept so they remain verifiable, unless you ask us to remove them.</li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and how it is used;</li>
          <li>correct or complete inaccurate data;</li>
          <li>erase your data and close your account, except records we must keep by law;</li>
          <li>withdraw consent you have given, without affecting earlier processing;</li>
          <li>nominate someone to exercise these rights on your behalf.</li>
        </ul>
        <p>
          Email <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a> from the address
          linked to your account. We reply within 30 days. If you are not satisfied with our
          response, you may complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <p>
        {LEGAL.BRAND} is intended for users aged 18 and over. Users under 18 may use it only with
        the consent and supervision of a parent or guardian. If you believe a child has given us
        personal data without that consent, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        We protect your data with encryption in transit, access controls and monitoring. See our{" "}
        <Link href={ROUTES.DATA_SECURITY}>Data Security</Link> page for details.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy as the service changes. The date at the top shows the latest
        version. If a change materially affects how we use your data, we will notify you by email or
        on the platform before it takes effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievances",
    content: (
      <p>
        For privacy questions, requests or grievances, email{" "}
        <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <p>
          We collect only what we need to run your courses, take payments and keep your account
          safe. We do not sell your data and we do not use advertising trackers.
        </p>
      }
      sections={sections}
    />
  );
}
