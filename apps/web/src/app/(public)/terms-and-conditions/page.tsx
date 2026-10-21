import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, ROUTES } from "@/lib/constants/const";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${LEGAL.BRAND}`,
  description: `The terms that govern your use of ${LEGAL.BRAND}.`,
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    content: (
      <p>
        By creating an account or using {LEGAL.BRAND}, you agree to these Terms &amp; Conditions and
        to our <Link href={ROUTES.PRIVACY_POLICY}>Privacy Policy</Link>. If you do not agree, do not
        use the service.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: (
      <p>
        You must be at least 18 years old, or use {LEGAL.BRAND} with the consent and supervision of
        a parent or guardian who accepts these terms on your behalf.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    content: (
      <ul>
        <li>Provide accurate information and keep it up to date.</li>
        <li>One account per person. Do not share your account or sign-in codes.</li>
        <li>
          You are responsible for activity on your account. Tell us immediately at{" "}
          <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a> if you suspect
          unauthorised use.
        </li>
      </ul>
    ),
  },
  {
    id: "purchases",
    title: "Purchases and pricing",
    content: (
      <ul>
        <li>
          Prices are in Indian Rupees (INR). Applicable taxes, including GST, are shown at checkout.
        </li>
        <li>Payments are processed by Razorpay and are subject to Razorpay&apos;s terms.</li>
        <li>
          Coupons are valid only as described, cannot be exchanged for cash, and may be withdrawn at
          any time.
        </li>
        <li>
          A purchase gives you access to the course once payment is confirmed. We may correct
          obvious pricing errors and will refund you if we cancel an order because of one.
        </li>
      </ul>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    content: (
      <ul>
        <li>
          To request a refund, contact{" "}
          <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a> with your order
          details. Each request is reviewed individually.
        </li>
        <li>
          Approved refunds are returned to the original payment method through Razorpay. Your bank
          may take several working days to credit it.
        </li>
        <li>When a refund is issued, we may end your access to that course.</li>
        <li>
          Refunds may be refused where there is evidence of abuse, such as repeated
          purchase-and-refund.
        </li>
      </ul>
    ),
  },
  {
    id: "licence",
    title: "Using course content",
    content: (
      <>
        <p>
          When you enrol, you get a personal, non-transferable, non-exclusive licence to view that
          course on {LEGAL.BRAND} for your own learning. You may not:
        </p>
        <ul>
          <li>download, record, copy or redistribute videos or other course material;</li>
          <li>share your access with others or resell it;</li>
          <li>use automated tools to scrape the platform.</li>
        </ul>
        <p>
          Course content belongs to its tutor or to {LEGAL.BRAND}. We may end your access without
          refund if you breach this licence.
        </p>
      </>
    ),
  },
  {
    id: "tutors",
    title: "Tutors",
    content: (
      <ul>
        <li>
          You must own or have the right to publish everything you upload, and it must not infringe
          anyone else&apos;s rights.
        </li>
        <li>
          You grant {LEGAL.BRAND} a licence to host, stream, display and promote your content on the
          platform for as long as it is published, and afterwards for students who already enrolled.
        </li>
        <li>
          Course descriptions must be accurate. You are responsible for answering student questions
          in good faith.
        </li>
        <li>We may review, unpublish or remove content that breaks these terms or the law.</li>
      </ul>
    ),
  },
  {
    id: "conduct",
    title: "Acceptable use",
    content: (
      <>
        <p>In discussions, feedback and anywhere else on the platform, do not:</p>
        <ul>
          <li>post unlawful, abusive, hateful, sexually explicit or misleading content;</li>
          <li>harass other users or share their personal information;</li>
          <li>post spam or advertising;</li>
          <li>
            try to break into accounts or systems, bypass access controls, or disrupt the service.
          </li>
        </ul>
        <p>We may remove content and suspend or ban accounts that do.</p>
      </>
    ),
  },
  {
    id: "certificates",
    title: "Certificates",
    content: (
      <p>
        Certificates of completion confirm that you completed a course on {LEGAL.BRAND}. They are
        not an academic qualification or accreditation. Anyone with the certificate link can verify
        it. We may revoke certificates obtained by cheating or abuse.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and closing your account",
    content: (
      <p>
        You can ask us to close your account at any time. We may suspend or close accounts that
        breach these terms, put other users at risk, or are required to be closed by law. Sections
        that by their nature should survive closure, such as payment obligations, licences granted
        by tutors to enrolled students, and limitations of liability, continue to apply.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimers",
    content: (
      <p>
        Courses are provided for education. We do not guarantee any particular result, job or income
        from completing a course. The service is provided &quot;as is&quot;; we work to keep it
        available and accurate but cannot promise it will be uninterrupted or error-free.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <p>
        To the extent the law allows, {LEGAL.BRAND} is not liable for indirect or consequential
        losses, and our total liability for any claim relating to a course is limited to the amount
        you paid for that course. Nothing in these terms limits liability that cannot be limited by
        law.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    content: (
      <p>
        These terms are governed by the laws of {LEGAL.JURISDICTION}, and the courts of{" "}
        {LEGAL.JURISDICTION} have jurisdiction over any dispute. Please contact us first; most
        issues can be resolved quickly.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may update these terms. The date at the top shows the latest version. Material changes
        will be announced by email or on the platform before they take effect. Continuing to use{" "}
        {LEGAL.BRAND} after that means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      summary={
        <p>
          The rules for using {LEGAL.BRAND} as a student or tutor: your account, purchases and
          refunds, how you may use course content, and what we expect from everyone on the platform.
        </p>
      }
      sections={sections}
    />
  );
}
