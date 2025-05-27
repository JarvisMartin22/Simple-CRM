import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { timezones } from '@/lib/timezones';

export interface ScheduleConfig {
  enabled: boolean;
  startDate?: Date;
  startTime?: string;
  timezone: string;
  sendingLimit?: number;
  sendingInterval?: number;
  recurringSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    timeOfDay?: string;
  };
}

const scheduleSchema = z.object({
  enabled: z.boolean(),
  startDate: z.date().optional(),
  startTime: z.string().optional(),
  timezone: z.string(),
  sendingLimit: z.number().min(1).optional(),
  sendingInterval: z.number().min(1).optional(),
  recurringSchedule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      timeOfDay: z.string().optional(),
    })
    .optional(),
});

interface CampaignSchedulerProps {
  campaignType: 'one-time' | 'sequence';
  initialConfig?: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
}

const CampaignScheduler: React.FC<CampaignSchedulerProps> = ({
  campaignType,
  initialConfig,
  onConfigChange,
}) => {
  const form = useForm<ScheduleConfig>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      enabled: initialConfig?.enabled ?? false,
      startDate: initialConfig?.startDate,
      startTime: initialConfig?.startTime,
      timezone: initialConfig?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      sendingLimit: initialConfig?.sendingLimit,
      sendingInterval: initialConfig?.sendingInterval,
      recurringSchedule: initialConfig?.recurringSchedule,
    },
  });

  const watchEnabled = form.watch('enabled');
  const watchRecurringSchedule = form.watch('recurringSchedule');

  const onSubmit = (values: ScheduleConfig) => {
    onConfigChange(values);
  };

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Schedule Settings</CardTitle>
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {watchEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="time"
                              {...field}
                              className="w-full"
                            />
                            <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem key={timezone} value={timezone}>
                              {timezone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sendingLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sending Limit (per hour)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum emails to send per hour
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sendingInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sending Interval (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Time between each email
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {campaignType === 'sequence' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recurringSchedule.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurring Schedule</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchRecurringSchedule?.frequency === 'weekly' && (
                      <FormField
                        control={form.control}
                        name="recurringSchedule.daysOfWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days of Week</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                  (day, index) => (
                                    <Button
                                      key={day}
                                      type="button"
                                      variant={
                                        field.value?.includes(index)
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className="w-12"
                                      onClick={() => {
                                        const current = field.value || [];
                                        field.onChange(
                                          current.includes(index)
                                            ? current.filter((d) => d !== index)
                                            : [...current, index]
                                        );
                                      }}
                                    >
                                      {day}
                                    </Button>
                                  )
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="recurringSchedule.interval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interval</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            {watchRecurringSchedule?.frequency === 'daily'
                              ? 'Run every X days'
                              : watchRecurringSchedule?.frequency === 'weekly'
                              ? 'Run every X weeks'
                              : 'Run every X months'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurringSchedule.timeOfDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time of Day</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input
                                type="time"
                                {...field}
                                className="w-full"
                              />
                              <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default CampaignScheduler; 