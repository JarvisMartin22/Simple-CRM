import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

interface TermsOfServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsOfServiceDialog({
  open,
  onOpenChange,
}: TermsOfServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle>Terms of Service for Golly CRM</DialogTitle>
          <DialogDescription>
            Effective Date: 5/15/2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2 h-[calc(75vh-180px)] overflow-auto" type="always">
          <div className="space-y-6 pr-4">
            <p>
              Welcome to Golly! These Terms of Service ("Terms") govern your access to and use of our CRM platform, website, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>
            <p>
              If you do not agree to these Terms, please do not use our Service.
            </p>

            <h3 className="text-lg font-semibold">1. Use of the Service</h3>
            <p>
              You may use the Service only in accordance with these Terms and all applicable laws. You must be at least 18 years old and have the authority to enter into a binding agreement to use the Service.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, and revocable license to use the Service solely for your business or personal CRM needs.
            </p>

            <h3 className="text-lg font-semibold">2. Your Account</h3>
            <p>
              To use the Service, you may be required to create an account and provide accurate information. You are responsible for maintaining the security of your account, including your password and any integrations you connect. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-lg font-semibold">3. Customer Data & Integrations</h3>
            <p>
              You retain full ownership of any data you input into the Service ("Customer Data"), including contacts, notes, files, and communications.
            </p>
            <p>
              By using integrations (e.g., with email, calendar, or third-party tools), you grant us permission to access and process necessary information to enable functionality within the CRM. We will only access the minimum amount of data required, and we will never use Customer Data for advertising, sell it, or share it outside the scope of delivering the Service.
            </p>
            <p>
              You are solely responsible for ensuring that your use of the Service (and your handling of Customer Data) complies with applicable laws and any obligations you may have to your end users or customers.
            </p>

            <h3 className="text-lg font-semibold">4. Acceptable Use</h3>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for unlawful or harmful purposes</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Attempt to gain unauthorized access to other user accounts or data</li>
              <li>Reverse engineer, decompile, or modify any part of the Service</li>
              <li>Upload or transmit malicious code or content</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your access if you violate these Terms or misuse the platform.
            </p>

            <h3 className="text-lg font-semibold">5. Payment and Billing (If Applicable)</h3>
            <p>
              If you purchase a paid plan, you agree to pay the applicable fees and authorize us or our third-party payment processor to charge your payment method. Fees are non-refundable unless otherwise stated.
            </p>
            <p>
              We reserve the right to change pricing with reasonable notice. Continued use of the Service after changes takes effect constitutes your acceptance.
            </p>

            <h3 className="text-lg font-semibold">6. Intellectual Property</h3>
            <p>
              All content, features, and functionality of the Service (excluding your Customer Data) are the property of Golly CRM and protected by intellectual property laws. You may not copy, reproduce, or distribute any part of the Service without our prior written consent.
            </p>

            <h3 className="text-lg font-semibold">7. Termination</h3>
            <p>
              You may cancel your account at any time. We reserve the right to suspend or terminate your access to the Service at our discretion, with or without cause, and with or without notice.
            </p>
            <p>
              Upon termination, your right to use the Service will cease immediately, and we may delete your Customer Data after a reasonable retention period, unless legally required to retain it.
            </p>

            <h3 className="text-lg font-semibold">8. Disclaimers</h3>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
            <p>
              To the extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h3 className="text-lg font-semibold">9. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, Golly CRM shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
            <p>
              Our total liability for any claims under these Terms shall not exceed the amount you paid us in the past 12 months.
            </p>

            <h3 className="text-lg font-semibold">10. Modifications</h3>
            <p>
              We may update these Terms from time to time. If we make material changes, we'll notify you via email or in-app notice. Continued use of the Service after such changes constitutes your acceptance.
            </p>

            <h3 className="text-lg font-semibold">11. Governing Law</h3>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.
            </p>

            <h3 className="text-lg font-semibold">12. Contact</h3>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Golly CRM<br />
              Email: help@golly.com<br />
              Website: https://trygolly.com
            </p>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-6">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TermsOfServiceDialog;
