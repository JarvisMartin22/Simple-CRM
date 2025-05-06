
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const OutlookIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    // In a real implementation, this would initiate OAuth flow
    // For demo purposes, we'll simulate a successful connection
    setTimeout(() => {
      setIsConnected(true);
      setIsDialogOpen(false);
      toast({
        title: "Outlook connected successfully",
        description: "Your Outlook account has been integrated with the CRM.",
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Outlook disconnected",
      description: "Your Outlook account has been disconnected from the CRM.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <CardTitle>Outlook Integration</CardTitle>
            {isConnected ? (
              <Badge className="ml-2 bg-green-500">
                <Check size={12} className="mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="ml-2 bg-gray-400">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="pb-4">
            Connect your Outlook account to sync emails and contacts with the CRM.
          </CardDescription>
          
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Account</span>
                <span className="text-sm text-gray-500">user@example.com</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Sync Status</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500">Syncing</Badge>
                  <span className="text-sm text-gray-500">Last synced 10 minutes ago</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Email Tracking</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connecting Outlook allows you to track emails, sync contacts, and automate workflows based on email interactions.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {isConnected ? (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
              <Button>Configure Settings</Button>
            </div>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Connect Outlook</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect to Outlook</DialogTitle>
                  <DialogDescription>
                    This will allow the CRM to access your Outlook account to sync emails and contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-md bg-amber-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          You will be redirected to Microsoft to authorize this application.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    The CRM requires the following permissions:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-500 space-y-1">
                    <li>Read and send emails</li>
                    <li>Access contact information</li>
                    <li>Manage calendar events</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect}>Continue with Microsoft</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardFooter>
      </Card>

      {isConnected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Email Tracking</CardTitle>
              <CardDescription>
                Configure how email tracking works with your Outlook account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">16</div>
                    <div className="text-gray-500 text-sm">Emails Sent</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">12</div>
                    <div className="text-gray-500 text-sm">Opens</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">4</div>
                    <div className="text-gray-500 text-sm">Replies</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Automation</CardTitle>
              <CardDescription>
                Set up automated workflows based on email interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <h3 className="font-medium mb-2">On Email Open</h3>
                  <p className="text-sm text-gray-500">
                    When a contact opens an email, create a follow-up task
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <h3 className="font-medium mb-2">On Email Click</h3>
                  <p className="text-sm text-gray-500">
                    When a contact clicks a link in an email, add a note to contact
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Add New Workflow</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </>
  );
};

export default OutlookIntegration;
