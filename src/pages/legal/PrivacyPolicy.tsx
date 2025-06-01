import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/">
              <span className="font-poetsen text-orange-500 text-center text-5xl">Golly</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="pb-4 border-b mb-6">
            <h1 className="text-2xl font-bold">Privacy Policy for Golly CRM</h1>
            <p className="text-gray-500">Effective Date: 5/15/2025</p>
          </div>

          <ScrollArea className="pr-2" type="always">
            <div className="space-y-6 pr-4">
              <p>
                Welcome to Golly. Your privacy is important to us. This Privacy Policy describes how we collect, use, and share information when you interact with our customer relationship management (CRM) software, website, and services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>

              <h3 className="text-lg font-semibold">1. Information We Collect</h3>
              <p>
                We collect both personal and business-related data to deliver and improve our services.
              </p>
              <h4 className="text-base font-medium mt-4">a. Information You Provide</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, password</li>
                <li>Company details (name, size, industry)</li>
                <li>CRM data including contacts, notes, deals, and activity logs</li>
                <li>Uploaded content, support inquiries, and feedback</li>
              </ul>
              
              <h4 className="text-base font-medium mt-4">b. Information from Integrations</h4>
              <p>
                When you connect third-party applications to your CRM account (e.g., email, calendar, communication tools), we collect information necessary to enable that functionality. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact metadata</li>
                <li>Email headers or content relevant to CRM records</li>
                <li>Calendar events, tasks, and notes</li>
                <li>File metadata or attachments</li>
              </ul>
              <p>
                You control which integrations are enabled, and may disconnect them at any time via your account settings.
              </p>
              
              <h4 className="text-base font-medium mt-4">c. Automatically Collected Information</h4>
              <p>
                We also gather usage and device data such as:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browser type, IP address, device identifiers</li>
                <li>Pages visited, time spent, feature usage</li>
                <li>Login and activity timestamps</li>
              </ul>
              <p>
                This data helps us improve performance, troubleshoot issues, and enhance usability.
              </p>

              <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
              <p>
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Deliver core CRM features and integrations</li>
                <li>Customize and optimize your experience</li>
                <li>Respond to customer support inquiries</li>
                <li>Analyze usage trends and improve product functionality</li>
                <li>Communicate product updates and account-related notifications</li>
                <li>Ensure security and detect misuse or fraud</li>
              </ul>
              <p>
                We do not use your CRM data for advertising or marketing purposes.
              </p>

              <h3 className="text-lg font-semibold">3. How We Share Information</h3>
              <p>
                We may share your information only as follows:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Service Providers – Hosting, email delivery, analytics, customer support, and infrastructure vendors who help operate our service</li>
                <li>Legal Compliance – If required by law or subpoena, or to protect the rights and safety of our users and platform</li>
                <li>Business Transfers – In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction</li>
              </ul>
              <p>
                We never sell your data.
              </p>

              <h3 className="text-lg font-semibold">4. Your Choices and Rights</h3>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access, update, or delete your personal information</li>
                <li>Disconnect third-party integrations</li>
                <li>Opt out of non-essential communications</li>
                <li>Request account deletion by contacting help@TryGolly.com</li>
              </ul>
              <p>
                You can manage most of this through your account settings.
              </p>

              <h3 className="text-lg font-semibold">5. Data Security</h3>
              <p>
                We implement commercially reasonable safeguards to protect your information, including encryption, secure servers, and access controls. While no system is 100% secure, we actively monitor and improve our security practices to keep your data safe.
              </p>

              <h3 className="text-lg font-semibold">6. Data Retention</h3>
              <p>
                We retain your information for as long as your account is active, or as needed to provide our services. If you cancel your account, we will delete or anonymize your data within a reasonable timeframe, unless we are required to retain it for legal reasons.
              </p>

              <h3 className="text-lg font-semibold">7. Children's Privacy</h3>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect personal information from children. If we become aware that we have collected such data, we will delete it immediately.
              </p>

              <h3 className="text-lg font-semibold">8. Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. If we make significant changes, we will notify you via email or in-app notice. We encourage you to review this page periodically.
              </p>

              <h3 className="text-lg font-semibold">9. Contact Us</h3>
              <p>
                If you have questions or concerns about this policy, contact us at:
              </p>
              <p>
                Golly CRM<br />
                Email: help@trygolly.com<br />
                Website: https://trygolly.com
              </p>
            </div>
          </ScrollArea>

          <div className="mt-8 text-center">
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-black text-gray-400 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Golly CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy; 