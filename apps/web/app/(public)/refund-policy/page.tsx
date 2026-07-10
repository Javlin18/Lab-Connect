import type { Metadata } from "next";
import { PolicyLayout, Section } from "../components/PolicyLayout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | LabConnect",
  description: "Refund and cancellation policy for LabConnect diagnostic test bookings.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout title="Refund and Cancellation Policy" lastUpdated="July 2026">
      {/* Intro info card */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-gray-600 text-[15px] leading-relaxed">
        <p>
          This refund and cancellation policy outlines how you can cancel or seek a refund for a
          service that you have purchased through the LabConnect Platform.
        </p>
      </div>

      <Section number="1" title="Cancellation Window">
        <p>
          Cancellations will only be considered if the request is made within <strong>1 day</strong>{" "}
          of placing the order. However, cancellation requests may not be entertained if our
          collection staff have already been dispatched to your location and the sample collection
          process has been initiated.
        </p>
      </Section>

      <Section number="2" title="Non-cancellable Services">
        <p>
          LabConnect does not accept cancellation requests for sample collection appointments where
          the collector has already reached the patient&rsquo;s location. However, a refund or
          rescheduling may be offered if LabConnect is unable to complete the collection due to an
          error on our part.
        </p>
      </Section>

      <Section number="3" title="Damaged or Defective Samples">
        <p>
          In case of any issue with the sample collection process or report quality, please report
          to our customer service team within <strong>1 day</strong> of the collection. The request
          will be entertained once our team has reviewed and verified the issue.
        </p>
        <p>
          Contact us at{" "}
          <a href="tel:7693080021" className="text-[#C41E3A] hover:underline font-medium">
            7693080021
          </a>{" "}
          or{" "}
          <a
            href="mailto:support@labconnect.co.in"
            className="text-[#C41E3A] hover:underline font-medium"
          >
            support@labconnect.co.in
          </a>
          .
        </p>
      </Section>

      <Section number="4" title="Report Quality Issues">
        <p>
          In case you feel that the report received is not as expected or there is a discrepancy,
          you must bring it to the notice of our customer service within <strong>1 day</strong> of
          receiving the report. Our customer service team will review your complaint and take an
          appropriate decision.
        </p>
      </Section>

      <Section number="5" title="Refund Processing">
        <p>
          In case of any refunds approved by LabConnect, it will take up to{" "}
          <strong>4 business days</strong> for the refund to be processed to your original payment
          method:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>UPI payments: 1–3 business days</li>
          <li>Credit/debit card: 3–5 business days</li>
          <li>Net banking: 2–4 business days</li>
        </ul>
        <p>To request a refund, contact us at:</p>
        <div className="bg-[#E8F5F1] border-l-4 border-[#0F6E56] rounded-r-xl p-5 space-y-1.5 mt-3">
          <p>
            <span className="font-semibold text-gray-700">Phone:</span>{" "}
            <a href="tel:7693080021" className="text-[#0F6E56] hover:underline">
              7693080021
            </a>
          </p>
          <p>
            <span className="font-semibold text-gray-700">Email:</span>{" "}
            <a href="mailto:support@labconnect.co.in" className="text-[#0F6E56] hover:underline">
              support@labconnect.co.in
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
