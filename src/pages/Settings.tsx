
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-semibold">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account settings and profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-h3">
                  JD
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-muted-foreground text-xs mt-1">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="First Name" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last Name" defaultValue="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Email" defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Phone Number" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Company Name" defaultValue="Folk CRM" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="Current Password" />
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <div></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="New Password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm Password" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button className="bg-primary">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Manage team members and permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center">
                      JD
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">John Doe</p>
                      <p className="text-muted-foreground text-small">john@example.com</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded text-small">
                    Admin
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      AS
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Alex Smith</p>
                      <p className="text-muted-foreground text-small">alex@example.com</p>
                    </div>
                  </div>
                  <div className="bg-muted-foreground/10 text-muted-foreground px-3 py-1 rounded text-small">
                    Member
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      SK
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Sarah Kim</p>
                      <p className="text-muted-foreground text-small">sarah@example.com</p>
                    </div>
                  </div>
                  <div className="bg-muted-foreground/10 text-muted-foreground px-3 py-1 rounded text-small">
                    Member
                  </div>
                </div>
                
                <Button className="w-full border border-dashed border-gray-300" variant="ghost">
                  + Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New contacts added</p>
                        <p className="text-muted-foreground text-small">Get notified when new contacts are added</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pipeline updates</p>
                        <p className="text-muted-foreground text-small">Get notified when deals change stages</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Task reminders</p>
                        <p className="text-muted-foreground text-small">Get reminders for upcoming and overdue tasks</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Campaign reports</p>
                        <p className="text-muted-foreground text-small">Get weekly campaign performance reports</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">App Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Team activity</p>
                        <p className="text-muted-foreground text-small">Get notified of actions by team members</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Deal status alerts</p>
                        <p className="text-muted-foreground text-small">Get notified when deals are at risk or stalled</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with other services and tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#EA4335] rounded-md flex items-center justify-center text-white font-bold">
                      G
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Google Workspace</p>
                      <p className="text-muted-foreground text-small">Email, Calendar, Contacts</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#0078D4] rounded-md flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Microsoft 365</p>
                      <p className="text-muted-foreground text-small">Outlook, Teams, OneDrive</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#0A66C2] rounded-md flex items-center justify-center text-white">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">LinkedIn</p>
                      <p className="text-muted-foreground text-small">Lead generation, contacts</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#1DA1F2] rounded-md flex items-center justify-center text-white">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Twitter</p>
                      <p className="text-muted-foreground text-small">Social engagement</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#4285F4] rounded-md flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Slack</p>
                      <p className="text-muted-foreground text-small">Team notifications</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#008000] rounded-md flex items-center justify-center text-white font-bold">
                      Q
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">QuickBooks</p>
                      <p className="text-muted-foreground text-small">Accounting & invoicing</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
