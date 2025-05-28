import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Smartphone, AlertTriangle, Link as LinkIcon, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailPreviewProps {
  subject: string;
  content: string;
  recipientData?: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
  onSendTest?: (email: string) => Promise<void>;
}

interface SpamCheckResult {
  score: number;
  issues: string[];
}

interface LinkValidationResult {
  url: string;
  isValid: boolean;
  error?: string;
}

export function EmailPreview({ subject, content, recipientData, onSendTest }: EmailPreviewProps) {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [spamScore, setSpamScore] = useState<SpamCheckResult | null>(null);
  const [linkValidation, setLinkValidation] = useState<LinkValidationResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // Replace variables in content with actual data
  const replaceVariables = (text: string) => {
    return text.replace(/{{([^}]+)}}/g, (match, variable) => {
      const [category, field] = variable.split('.');
      if (category === 'contact' && recipientData) {
        switch (field) {
          case 'first_name':
            return recipientData.firstName || '[First Name]';
          case 'last_name':
            return recipientData.lastName || '[Last Name]';
          case 'email':
            return recipientData.email || '[Email]';
          case 'company':
            return recipientData.company || '[Company]';
          default:
            return `[${field}]`;
        }
      }
      return match;
    });
  };

  const previewContent = replaceVariables(content);
  const previewSubject = replaceVariables(subject);

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      if (onSendTest) {
        await onSendTest(testEmail);
      }
      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email",
      });
    } catch (error) {
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const checkSpamScore = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-spam-score', {
        body: {
          subject: previewSubject,
          content: previewContent,
        },
      });

      if (error) throw error;
      setSpamScore(data);
    } catch (error) {
      toast({
        title: "Failed to check spam score",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const validateLinks = async () => {
    setIsChecking(true);
    try {
      // Extract links from content using regex
      const linkRegex = /href=["'](https?:\/\/[^"']+)["']/g;
      const links = [...previewContent.matchAll(linkRegex)].map(match => match[1]);

      const results = await Promise.all(
        links.map(async (url) => {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            return {
              url,
              isValid: response.ok,
              error: response.ok ? undefined : `Status: ${response.status}`,
            };
          } catch (error) {
            return {
              url,
              isValid: false,
              error: 'Failed to connect',
            };
          }
        })
      );

      setLinkValidation(results);
    } catch (error) {
      toast({
        title: "Failed to validate links",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="desktop">
          <TabsList>
            <TabsTrigger value="desktop">
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="font-medium mb-2">Subject: {previewSubject}</div>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="max-w-sm mx-auto">
                  <div className="font-medium mb-2">Subject: {previewSubject}</div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={checkSpamScore}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Check Spam Score
            </Button>
            <Button
              variant="outline"
              onClick={validateLinks}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Validate Links
            </Button>
          </div>

          {spamScore && (
            <Alert variant={spamScore.score > 5 ? "destructive" : "default"}>
              <AlertTitle>Spam Score: {spamScore.score.toFixed(1)}/10</AlertTitle>
              <AlertDescription>
                {spamScore.issues.length > 0 ? (
                  <ul className="list-disc pl-4 mt-2">
                    {spamScore.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  "No spam issues detected"
                )}
              </AlertDescription>
            </Alert>
          )}

          {linkValidation.length > 0 && (
            <Alert>
              <AlertTitle>Link Validation Results</AlertTitle>
              <AlertDescription>
                <ul className="space-y-2 mt-2">
                  {linkValidation.map((result, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Badge variant={result.isValid ? "default" : "destructive"}>
                        {result.isValid ? "Valid" : "Invalid"}
                      </Badge>
                      <span className="text-sm truncate">{result.url}</span>
                      {result.error && (
                        <span className="text-sm text-destructive">
                          ({result.error})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4">
            <Label htmlFor="test-email">Send test email to:</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                onClick={handleSendTest}
                disabled={isSending || !testEmail}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Test
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 