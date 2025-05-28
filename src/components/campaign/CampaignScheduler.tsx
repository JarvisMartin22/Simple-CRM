import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { WeekdayPicker } from '@/components/ui/weekday-picker';

export interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  startDate?: Date;
  startTime?: string;
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
  campaignType: 'one_time' | 'automated' | 'sequence';
  initialConfig?: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
}

const CampaignScheduler: React.FC<CampaignSchedulerProps> = ({
  campaignType,
  initialConfig,
  onConfigChange,
}) => {
  const form = useForm<ScheduleConfig>({
    defaultValues: {
      enabled: initialConfig?.enabled ?? false,
      timezone: initialConfig?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate: initialConfig?.startDate,
      startTime: initialConfig?.startTime,
      recurringSchedule: initialConfig?.recurringSchedule ?? {
        frequency: 'daily',
        interval: 1,
      },
    },
  });

  const enabled = form.watch('enabled');
  const frequency = form.watch('recurringSchedule.frequency');

  useEffect(() => {
    const subscription = form.watch((value) => {
      onConfigChange(value as ScheduleConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onConfigChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Campaign</CardTitle>
        <CardDescription>
          Configure when your campaign should be sent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Schedule for Later
                    </FormLabel>
                    <FormDescription>
                      Send this campaign at a specific date and time
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {enabled && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value?.toISOString()}
                            onSelect={(date) => field.onChange(date ? new Date(date) : undefined)}
                          />
                        </FormControl>
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
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(campaignType === 'automated' || campaignType === 'sequence') && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recurringSchedule.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
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
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {frequency === 'daily'
                              ? 'Number of days between sends'
                              : frequency === 'weekly'
                              ? 'Number of weeks between sends'
                              : 'Number of months between sends'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {frequency === 'weekly' && (
                      <FormField
                        control={form.control}
                        name="recurringSchedule.daysOfWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days of Week</FormLabel>
                            <FormControl>
                              <WeekdayPicker
                                value={field.value || []}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="recurringSchedule.timeOfDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time of Day</FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CampaignScheduler; 