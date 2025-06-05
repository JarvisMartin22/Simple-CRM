
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Lock, User, KeyRound, Users, Shield, Building, Paintbrush, Globe, Mail, AlertCircle, Plus, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BillingTab from '@/components/settings/BillingTab';
import TeamInvitations from '@/components/settings/TeamInvitations';
import { useSearchParams } from 'react-router-dom';

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-medium">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and workspace settings</p>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b pb-0 rounded-none">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <KeyRound className="w-4 h-4 mr-2" />
            Password
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Building className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Paintbrush className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                  <div className="flex flex-col items-center space-y-3 mb-4 md:mb-0">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="text-xl">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Upload</Button>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="john@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Time Zone & Language</CardTitle>
                <CardDescription>Set your preferred language and time zone.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select id="language" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="fr-FR">Français (France)</option>
                    <option value="de-DE">Deutsch (Deutschland)</option>
                    <option value="ja-JP">日本語 (日本)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <select id="timezone" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC+0">Greenwich Mean Time (UTC+0)</option>
                    <option value="UTC+1">Central European Time (UTC+1)</option>
                    <option value="UTC+8">China Standard Time (UTC+8)</option>
                    <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select id="dateFormat" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to enhance account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input type="password" id="currentPassword" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input type="password" id="newPassword" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input type="password" id="confirmPassword" />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 flex items-start mt-2">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Password requirements:</p>
                  <ul className="list-disc list-inside pl-1 mt-1 space-y-1">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Cancel</Button>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm mt-6">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-base">Text Message Authentication</h4>
                  <p className="text-sm text-gray-500">Receive a code via SMS when signing in.</p>
                </div>
                <Switch />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-base">Authenticator App</h4>
                  <p className="text-sm text-gray-500">Use an authentication app to get verification codes.</p>
                </div>
                <Button variant="outline">Set Up</Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-base">Security Keys</h4>
                  <p className="text-sm text-gray-500">Use security keys for sign-in.</p>
                </div>
                <Button variant="outline">Add Key</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team">
          <TeamInvitations />
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">New lead notifications</Label>
                    <p className="text-xs text-gray-500">Get notified when a new lead is added to the system.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Deal updates</Label>
                    <p className="text-xs text-gray-500">Get notified about status changes in your deals.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Task reminders</Label>
                    <p className="text-xs text-gray-500">Get reminders about upcoming and overdue tasks.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Campaign statistics</Label>
                    <p className="text-xs text-gray-500">Receive reports about your campaign performance.</p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">In-App Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Mentions</Label>
                    <p className="text-xs text-gray-500">Get notified when someone mentions you in a comment.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Assignment notifications</Label>
                    <p className="text-xs text-gray-500">Get notified when a contact or deal is assigned to you.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">System updates</Label>
                    <p className="text-xs text-gray-500">Get notified about important system updates.</p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Digest</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Frequency</Label>
                  <select id="digest-frequency" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button variant="outline">Cancel</Button>
              <Button className="ml-auto">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Company Tab */}
        <TabsContent value="company">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Acme Inc" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input id="companyWebsite" defaultValue="https://www.acmeinc.com" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select id="industry" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <select id="companySize" className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-none ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-gray-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <textarea 
                  id="companyDescription" 
                  rows={4} 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Acme Inc is a technology company focused on innovative software solutions for businesses."
                ></textarea>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm mt-6">
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>Manage custom fields for contacts, deals, and companies.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="contacts" className="w-full">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="deals">Deals</TabsTrigger>
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contacts" className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">LinkedIn Profile</p>
                      <p className="text-xs text-gray-500">Text field</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">First Contact Date</p>
                      <p className="text-xs text-gray-500">Date field</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                  
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </TabsContent>
                
                <TabsContent value="deals" className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">Decision Maker</p>
                      <p className="text-xs text-gray-500">Contact lookup</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">Contract Value</p>
                      <p className="text-xs text-gray-500">Currency field</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                  
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </TabsContent>
                
                <TabsContent value="companies" className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">Industry Vertical</p>
                      <p className="text-xs text-gray-500">Dropdown field</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                  
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your CRM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 cursor-pointer bg-white flex flex-col items-center justify-center">
                    <div className="w-full h-24 bg-white border rounded-md mb-2 flex items-center justify-center">
                      <span className="text-sm text-gray-800 font-medium">Light</span>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="light-theme" defaultChecked />
                      <Label htmlFor="light-theme" className="ml-2 text-sm">Light Theme</Label>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 cursor-pointer bg-white flex flex-col items-center justify-center">
                    <div className="w-full h-24 bg-gray-900 border rounded-md mb-2 flex items-center justify-center">
                      <span className="text-sm text-gray-100 font-medium">Dark</span>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="dark-theme" />
                      <Label htmlFor="dark-theme" className="ml-2 text-sm">Dark Theme</Label>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 cursor-pointer bg-white flex flex-col items-center justify-center">
                    <div className="w-full h-24 bg-gradient-to-b from-white to-gray-900 border rounded-md mb-2 flex items-center justify-center">
                      <span className="text-sm text-gray-800 font-medium">Auto</span>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="system-theme" />
                      <Label htmlFor="system-theme" className="ml-2 text-sm">System Theme</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Custom Branding</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="color" id="primaryColor" defaultValue="#191919" className="w-12 h-10 p-1" />
                      <Input defaultValue="#191919" className="flex-1" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="color" id="accentColor" defaultValue="#6B7280" className="w-12 h-10 p-1" />
                      <Input defaultValue="#6B7280" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Layout</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Compact Mode</Label>
                      <p className="text-xs text-gray-500">Use a more compact layout with less white space.</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Full-width Layout</Label>
                      <p className="text-xs text-gray-500">Use the full width of the screen for content.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Reset to Default</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
