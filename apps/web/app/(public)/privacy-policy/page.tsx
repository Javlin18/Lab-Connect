import type { Metadata } from "next";
import { PolicyLayout, Section } from "../components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | LabConnect",
  description:
    "Privacy policy for LabConnect — how we collect, use and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="July 2026">
      {/* Intro info card */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-gray-600 text-[15px] leading-relaxed">
        <p>
          This Privacy Policy describes how <strong>LabConnect Diagnostics</strong> and its
          affiliates (collectively &lsquo;LabConnect, we, our, us&rsquo;) collect, use, share,
          protect or otherwise process your information/personal data through our website{" "}
          <a href="https://labconnect.co.in" className="text-[#C41E3A] hover:underline">
            https://labconnect.co.in
          </a>{" "}
          (hereinafter referred to as Platform). Please note that you may be able to browse certain
          sections of the Platform without registering with us. We do not offer any product/service
          under this Platform outside India and your personal data will primarily be stored and
          processed in India. By visiting this Platform, providing your information or availing any
          product/service offered on the Platform, you expressly agree to be bound by the terms and
          conditions of this Privacy Policy.
        </p>
      </div>

      <Section number="1" title="Collection">
        <p>
          We collect your personal data when you use our Platform, services or otherwise interact
          with us during the course of our relationship. Some of the information that we may collect
          includes but is not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Personal data provided during sign-up such as name, date of birth, address,
            telephone/mobile number, and email ID
          </li>
          <li>
            Sensitive personal data such as bank account or credit/debit card information collected
            with your consent
          </li>
          <li>
            Behavioural data including your preferences and interactions on our Platform
          </li>
          <li>
            Transaction information related to your bookings on the Platform
          </li>
        </ul>
        <p>
          You always have the option to not provide information, by choosing not to use a particular
          service or feature on the Platform. If you receive an email or a call from a person
          claiming to be LabConnect seeking any personal data like debit/credit card PIN or
          net-banking passwords, please never provide such information.
        </p>
      </Section>

      <Section number="2" title="Usage">
        <p>
          We use personal data to provide the services you request. We use your personal data to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Handle and fulfil your test booking appointments</li>
          <li>Enhance your customer experience</li>
          <li>Resolve disputes and troubleshoot problems</li>
          <li>Inform you about offers, services, and updates</li>
          <li>Customise your experience on our Platform</li>
          <li>Detect and protect against fraud and other criminal activity</li>
          <li>Enforce our terms and conditions</li>
          <li>Conduct marketing research, analysis and surveys</li>
        </ul>
      </Section>

      <Section number="3" title="Sharing">
        <p>
          We may share your personal data internally within our group entities and affiliates to
          provide you access to our services. We may disclose personal data to third parties such
          as:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Laboratory partners for processing your test samples</li>
          <li>
            Third party service providers including logistics and payment partners
          </li>
          <li>
            Government agencies or authorised law enforcement agencies if required by law
          </li>
        </ul>
        <p>
          We do not sell or rent your personal information to any third party for marketing
          purposes.
        </p>
      </Section>

      <Section number="4" title="Security Precautions">
        <p>
          To protect your personal data from unauthorised access or disclosure, loss or misuse we
          adopt reasonable security practices and procedures. We adhere to our security guidelines
          to protect your information against unauthorised access and offer the use of a secure
          server. However, the transmission of information is not completely secure for reasons
          beyond our control. Users are responsible for ensuring the protection of login and
          password records for their account.
        </p>
      </Section>

      <Section number="5" title="Data Deletion and Retention">
        <p>
          You have an option to delete your account by visiting your profile and settings on our
          Platform. This action would result in you losing all information related to your account.
          You may also write to us at the contact information provided below to assist you with
          these requests.
        </p>
        <p>
          We retain your personal data for a period no longer than is required for the purpose for
          which it was collected or as required under any applicable law. We may retain data related
          to you if we believe it may be necessary to prevent fraud or future abuse or for other
          legitimate purposes.
        </p>
      </Section>

      <Section number="6" title="Your Rights">
        <p>
          You may access, rectify, and update your personal data directly through the
          functionalities provided on the Platform. You have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Request deletion of your personal data</li>
          <li>
            Withdraw consent for processing your personal data by writing to our Grievance Officer
          </li>
        </ul>
      </Section>

      <Section number="7" title="Consent">
        <p>
          By visiting our Platform or by providing your information, you consent to the collection,
          use, storage, disclosure and processing of your information on the Platform in accordance
          with this Privacy Policy. You have an option to withdraw your consent by writing to the
          Grievance Officer at the contact information provided below. Please mention &lsquo;Withdrawal
          of consent for processing personal data&rsquo; in the subject line of your communication.
        </p>
      </Section>

      <Section number="8" title="Changes to this Privacy Policy">
        <p>
          Please check our Privacy Policy periodically for changes. We may update this Privacy
          Policy to reflect changes to our information practices. We will alert/notify you about
          significant changes in the manner required under applicable laws.
        </p>
      </Section>

      <Section number="9" title="Grievance Officer">
        <p>
          If you have any concerns or questions about this Privacy Policy or the handling of your
          personal data, please contact our Grievance Officer:
        </p>
        <div className="bg-[#E8F5F1] border-l-4 border-[#0F6E56] rounded-r-xl p-5 space-y-1.5 mt-3">
          <p>
            <span className="font-semibold text-gray-700">Name:</span>{" "}
            <span className="text-gray-600">Chandrabhan Prajapati</span>
          </p>
          <p>
            <span className="font-semibold text-gray-700">Designation:</span> Founder, LabConnect
            Diagnostics
          </p>
          <p>
            <span className="font-semibold text-gray-700">Address:</span> 18, Dada Thanthanpal
            Ward, Jabalpur, Madhya Pradesh - 482001
          </p>
          <p>
            <span className="font-semibold text-gray-700">Phone:</span>{" "}
            <a href="tel:7693080021" className="text-[#0F6E56] hover:underline">
              7693080021
            </a>
          </p>
          <p>
            <span className="font-semibold text-gray-700">Email:</span>{" "}
            <a href="mailto:labconnect.work@gmail.com" className="text-[#0F6E56] hover:underline">
              labconnect.work@gmail.com
            </a>
          </p>
          <p>
            <span className="font-semibold text-gray-700">Business Hours:</span> Monday – Saturday,
            9:00 AM to 6:00 PM
          </p>
        </div>
      </Section>
    </PolicyLayout>
  );
}
