
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricDetailProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    title: string;
    value: string | number;
    change?: string;
    changeValue?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    data?: any[];
  };
}

// Mock data for the charts
const generateMockData = (type: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

  if (type === 'Total Contacts') {
    return recentMonths.map((month, index) => ({
      name: month,
      value: 800 + Math.floor(Math.random() * 500) + (index * 70)
    }));
  } else if (type === 'Open Deals') {
    return recentMonths.map((month, index) => ({
      name: month,
      value: 20 + Math.floor(Math.random() * 20) + (index * 2)
    }));
  } else if (type === "This Month's Revenue") {
    return recentMonths.map((month, index) => ({
      name: month,
      value: 30000 + Math.floor(Math.random() * 50000) + (index * 8000)
    }));
  } else {
    return recentMonths.map((month, index) => ({
      name: month,
      value: 4 + Math.floor(Math.random() * 8) + (index * 0.5)
    }));
  }
};

const MetricDetail: React.FC<MetricDetailProps> = ({ isOpen, onClose, metric }) => {
  const chartData = React.useMemo(() => generateMockData(metric.title), [metric.title]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{metric.title} Details</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{metric.title}</CardTitle>
                {metric.changeValue && (
                  <Badge variant="outline" className={
                    metric.changeType === 'positive' ? 'text-green-600 bg-green-50' : 
                    metric.changeType === 'negative' ? 'text-red-600 bg-red-50' : 
                    'bg-gray-50 text-gray-700'
                  }>
                    {metric.changeValue}
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold mt-2">{metric.value}</div>
              {metric.change && <div className="text-sm text-gray-500">{metric.change}</div>}
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={
                        metric.changeType === 'positive' ? '#10b981' : 
                        metric.changeType === 'negative' ? '#ef4444' : 
                        '#6366f1'
                      }
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetricDetail;
